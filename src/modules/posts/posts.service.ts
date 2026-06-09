import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { NearbyPostsQueryDto } from './dto/nearby-posts-query.dto';
import { PostsQueryDto } from './dto/posts-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post, PostStatus } from './entities/post.entities';

export interface NearbyPostResponse {
  post_id: number;
  title: string;
  content: string;
  visibility_radius: number;
  status: PostStatus;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
  distance_m: number;
  distance_label: string;
  activity_score: number;
  user: {
    user_id: number;
    username: string;
    profile_image?: string | null;
  } | null;
  comments_count: number;
  reactions_count: number;
}

interface NearbyPostRaw {
  post_id: number | string;
  title: string;
  content: string;
  visibility_radius: number | string;
  status: PostStatus;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
  user_id: number | string | null;
  username: string | null;
  profile_image: string | null;
  comments_count: number | string;
  reactions_count: number | string;
  distance_m: number | string;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<Post> {
    try {
      const post = this.postsRepository.create({
        title: createPostDto.title,
        content: createPostDto.content,
        latitude: createPostDto.latitude,
        longitude: createPostDto.longitude,
        visibility_radius: createPostDto.visibility_radius ?? 200,
        expires_at: new Date(createPostDto.expires_at),
        user: { user_id: createPostDto.user_id },
      });

      return await this.postsRepository.save(post);
    } catch {
      throw new BadRequestException('Failed to create post');
    }
  }

  findAll(query: PostsQueryDto = {}): Promise<Post[]> {
    const sort = query.sort ?? 'latest';

    if (sort === 'active') {
      return this.postsRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.user', 'user')
        .leftJoinAndSelect('post.comments', 'comments')
        .leftJoinAndSelect('post.reactions', 'reactions')
        .where('post.status = :status', { status: PostStatus.ACTIVE })
        .andWhere('post.expires_at > NOW()')
        .orderBy(
          `(
            SELECT COUNT(*) FROM comments active_comments
            WHERE active_comments.post_id = post.post_id
          ) + (
            SELECT COUNT(*) FROM reactions active_reactions
            WHERE active_reactions.post_id = post.post_id
          )`,
          'DESC',
        )
        .addOrderBy('post.created_at', 'DESC')
        .getMany();
    }

    return this.postsRepository.find({
      where: {
        status: PostStatus.ACTIVE,
      },
      relations: ['user', 'comments', 'reactions'],
      order: { created_at: 'DESC' },
    });
  }

  search(query: string): Promise<Post[]> {
    const search = `%${this.escapeLikePattern(query)}%`;

    return this.postsRepository
      .createQueryBuilder('search_post')
      .leftJoinAndSelect('search_post.user', 'user')
      .leftJoinAndSelect('search_post.comments', 'comments')
      .leftJoinAndSelect('search_post.reactions', 'reactions')
      .where('search_post.status = :status', { status: PostStatus.ACTIVE })
      .andWhere('search_post.expires_at > NOW()')
      .andWhere(
        `(
          search_post.title ILIKE :search ESCAPE '\\' OR
          search_post.content ILIKE :search ESCAPE '\\' OR
          user.username ILIKE :search ESCAPE '\\'
        )`,
        { search },
      )
      .orderBy('search_post.created_at', 'DESC')
      .limit(5)
      .getMany();
  }

  async findNearby(query: NearbyPostsQueryDto): Promise<NearbyPostResponse[]> {
    const radius = query.radius ?? 200;

    const distanceSql = `
      6371000 * 2 * asin(
        sqrt(
          power(sin(radians((post.latitude::float - :lat) / 2)), 2) +
          cos(radians(:lat)) *
          cos(radians(post.latitude::float)) *
          power(sin(radians((post.longitude::float - :lng) / 2)), 2)
        )
      )
    `;

    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoin('post.user', 'user')
      .leftJoin('post.comments', 'comment')
      .leftJoin('post.reactions', 'reaction')
      .select('post.post_id', 'post_id')
      .addSelect('post.title', 'title')
      .addSelect('post.content', 'content')
      .addSelect('post.visibility_radius', 'visibility_radius')
      .addSelect('post.status', 'status')
      .addSelect('post.expires_at', 'expires_at')
      .addSelect('post.created_at', 'created_at')
      .addSelect('post.updated_at', 'updated_at')
      .addSelect('user.user_id', 'user_id')
      .addSelect('user.username', 'username')
      .addSelect('user.profile_image', 'profile_image')
      .addSelect('COUNT(DISTINCT comment.comment_id)', 'comments_count')
      .addSelect('COUNT(DISTINCT reaction.reaction_id)', 'reactions_count')
      .addSelect(distanceSql, 'distance_m')
      .where('post.status = :status', { status: PostStatus.ACTIVE })
      .andWhere('post.expires_at > NOW()')
      .andWhere('post.latitude IS NOT NULL')
      .andWhere('post.longitude IS NOT NULL')
      .groupBy('post.post_id')
      .addGroupBy('user.user_id')
      .having(`${distanceSql} <= :radius`)
      .andHaving(`${distanceSql} <= post.visibility_radius`)
      .setParameters({ lat: query.lat, lng: query.lng, radius });

    queryBuilder.orderBy('post.created_at', 'DESC');

    const rows = await queryBuilder.getRawMany<NearbyPostRaw>();

    return rows.map((row) => {
      const commentsCount = Number(row.comments_count);
      const reactionsCount = Number(row.reactions_count);
      const approximateDistance = this.approximateDistanceMeters(
        Number(row.distance_m),
      );

      return {
        post_id: Number(row.post_id),
        title: row.title,
        content: row.content,
        visibility_radius: Number(row.visibility_radius),
        status: row.status,
        expires_at: row.expires_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        distance_m: approximateDistance,
        distance_label: this.distanceLabel(approximateDistance),
        activity_score: commentsCount + reactionsCount,
        user: row.user_id
          ? {
              user_id: Number(row.user_id),
              username: row.username ?? '',
              profile_image: row.profile_image,
            }
          : null,
        comments_count: commentsCount,
        reactions_count: reactionsCount,
      };
    });
  }

  async findOne(postId: number): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { post_id: postId },
      relations: ['user', 'comments', 'reactions'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    return post;
  }

  async update(postId: number, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(postId);

    if (updatePostDto.title !== undefined) {
      post.title = updatePostDto.title;
    }

    if (updatePostDto.content !== undefined) {
      post.content = updatePostDto.content;
    }

    if (updatePostDto.latitude !== undefined) {
      post.latitude = updatePostDto.latitude;
    }

    if (updatePostDto.longitude !== undefined) {
      post.longitude = updatePostDto.longitude;
    }

    if (updatePostDto.visibility_radius !== undefined) {
      post.visibility_radius = updatePostDto.visibility_radius;
    }

    if (updatePostDto.expires_at !== undefined) {
      post.expires_at = new Date(updatePostDto.expires_at);
    }

    try {
      return await this.postsRepository.save(post);
    } catch {
      throw new BadRequestException('Failed to update post');
    }
  }

  async remove(postId: number): Promise<{ message: string }> {
    const post = await this.findOne(postId);

    try {
      await this.postsRepository.remove(post);
      return { message: 'Post deleted successfully' };
    } catch {
      throw new BadRequestException('Failed to delete post');
    }
  }

  private approximateDistanceMeters(distance: number): number {
    if (distance <= 50) {
      return 50;
    }

    return Math.ceil(distance / 50) * 50;
  }

  private distanceLabel(distance: number): string {
    return `within ${distance}m`;
  }

  private escapeLikePattern(value: string): string {
    return value.replace(/[\\%_]/g, '\\$&');
  }
}
