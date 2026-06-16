import {
  BadRequestException,
  ForbiddenException,
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
import { PostImage } from './entities/post-image.entity';
import { R2ImageStorageService } from '../users/r2-image-storage.service';

export interface NearbyPostResponse {
  post_id: number;
  title: string;
  content: string;
  image_url: string | null;
  image_urls: string[];
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

export type PublicPost = Omit<Post, 'latitude' | 'longitude'> & {
  image_urls: string[];
};

interface NearbyPostRaw {
  post_id: number | string;
  title: string;
  content: string;
  image_url: string | null;
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
    @InjectRepository(PostImage)
    private readonly postImagesRepository: Repository<PostImage>,
    private readonly imageStorage: R2ImageStorageService,
  ) {}

  async create(
    createPostDto: CreatePostDto,
    userId: number,
    images: Express.Multer.File[] = [],
  ): Promise<PublicPost> {
    const uploadedImages = await this.uploadPostImages(userId, images);

    try {
      const post = this.postsRepository.create({
        title: createPostDto.title,
        content: createPostDto.content,
        image_url: uploadedImages[0]?.url ?? null,
        latitude: createPostDto.latitude,
        longitude: createPostDto.longitude,
        visibility_radius: createPostDto.visibility_radius ?? 200,
        expires_at: new Date(createPostDto.expires_at),
        user: { user_id: userId },
      });

      const savedPost = await this.postsRepository.save(post);
      savedPost.images = await this.savePostImages(savedPost, uploadedImages);
      return this.toPublicPost(savedPost);
    } catch {
      await this.deleteUploadedImages(uploadedImages);
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
        .leftJoinAndSelect('post.images', 'images')
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
      relations: ['user', 'comments', 'reactions', 'images'],
      order: { created_at: 'DESC' },
    });
  }

  async findMine(userId: number): Promise<PublicPost[]> {
    let posts: Post[];

    try {
      posts = await this.postsRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.user', 'user')
        .leftJoinAndSelect('post.comments', 'comments')
        .leftJoinAndSelect('post.reactions', 'reactions')
        .leftJoinAndSelect('post.images', 'images')
        .where('user.user_id = :userId', { userId })
        .andWhere('post.status != :removed', { removed: PostStatus.REMOVED })
        .orderBy('post.created_at', 'DESC')
        .getMany();
    } catch (error) {
      if (!this.isMissingPostImagesTableError(error)) throw error;

      posts = await this.postsRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.user', 'user')
        .leftJoinAndSelect('post.comments', 'comments')
        .leftJoinAndSelect('post.reactions', 'reactions')
        .where('user.user_id = :userId', { userId })
        .andWhere('post.status != :removed', { removed: PostStatus.REMOVED })
        .orderBy('post.created_at', 'DESC')
        .getMany();
    }

    return posts.map((post) => this.toPublicPost(post));
  }

  async findByUserVisible(
    targetUserId: number,
    viewerUserId: number,
    lat?: number,
    lng?: number,
    limit = 3,
  ): Promise<PublicPost[]> {
    const queryBuilder = this.postsRepository
      .createQueryBuilder('profile_post')
      .leftJoinAndSelect('profile_post.user', 'user')
      .leftJoinAndSelect('profile_post.comments', 'comments')
      .leftJoinAndSelect('profile_post.reactions', 'reactions')
      .leftJoinAndSelect('profile_post.images', 'images')
      .where('user.user_id = :targetUserId', { targetUserId })
      .andWhere('profile_post.status != :removed', {
        removed: PostStatus.REMOVED,
      })
      .orderBy('profile_post.created_at', 'DESC')
      .take(limit);

    if (targetUserId !== viewerUserId) {
      if (lat === undefined || lng === undefined) return [];

      const distanceSql = this.distanceSql('profile_post');
      queryBuilder
        .andWhere('profile_post.status = :status', {
          status: PostStatus.ACTIVE,
        })
        .andWhere('profile_post.expires_at > NOW()')
        .andWhere('profile_post.latitude IS NOT NULL')
        .andWhere('profile_post.longitude IS NOT NULL')
        .andWhere(`${distanceSql} <= profile_post.visibility_radius`)
        .setParameters({ lat, lng });
    }

    const posts = await queryBuilder.getMany();
    return posts.map((post) => this.toPublicPost(post));
  }

  async search(query: string, lat: number, lng: number): Promise<PublicPost[]> {
    const search = `%${this.escapeLikePattern(query)}%`;
    const distanceSql = this.distanceSql('search_post');

    const posts = await this.postsRepository
      .createQueryBuilder('search_post')
      .leftJoinAndSelect('search_post.user', 'user')
      .leftJoinAndSelect('search_post.comments', 'comments')
      .leftJoinAndSelect('search_post.reactions', 'reactions')
      .leftJoinAndSelect('search_post.images', 'images')
      .where('search_post.status = :status', { status: PostStatus.ACTIVE })
      .andWhere('search_post.expires_at > NOW()')
      .andWhere('search_post.latitude IS NOT NULL')
      .andWhere('search_post.longitude IS NOT NULL')
      .andWhere(`${distanceSql} <= search_post.visibility_radius`)
      .andWhere(
        `(
          search_post.title ILIKE :search ESCAPE '\\' OR
          search_post.content ILIKE :search ESCAPE '\\' OR
          user.username ILIKE :search ESCAPE '\\'
        )`,
        { search },
      )
      .setParameters({ lat, lng })
      .orderBy('search_post.created_at', 'DESC')
      .limit(5)
      .getMany();

    return posts.map((post) => this.toPublicPost(post));
  }

  async findNearby(query: NearbyPostsQueryDto): Promise<NearbyPostResponse[]> {
    const radius = query.radius ?? 200;

    const distanceSql = this.distanceSql('post');

    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoin('post.user', 'user')
      .leftJoin('post.comments', 'comment')
      .leftJoin('post.reactions', 'reaction')
      .select('post.post_id', 'post_id')
      .addSelect('post.title', 'title')
      .addSelect('post.content', 'content')
      .addSelect('post.image_url', 'image_url')
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

    if (query.sort === 'active') {
      queryBuilder
        .orderBy(
          'COUNT(DISTINCT comment.comment_id) + COUNT(DISTINCT reaction.reaction_id)',
          'DESC',
        )
        .addOrderBy('post.created_at', 'DESC');
    } else {
      queryBuilder.orderBy('post.created_at', 'DESC');
    }

    const rows = await queryBuilder.getRawMany<NearbyPostRaw>();
    const imageUrlMap = await this.loadImageUrlsForPostIds(
      rows.map((row) => Number(row.post_id)),
    );

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
        image_url: imageUrlMap.get(Number(row.post_id))?.[0] ?? row.image_url,
        image_urls: imageUrlMap.get(Number(row.post_id)) ?? this.compactUrls([row.image_url]),
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
      relations: ['user', 'comments', 'reactions', 'images'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    return post;
  }

  async findVisibleOne(
    postId: number,
    userId: number,
    lat?: number,
    lng?: number,
  ): Promise<PublicPost> {
    const post = await this.findOne(postId);
    const owner = post.user as { user_id?: number } | null;
    const ownerId = Number(owner?.user_id);

    if (ownerId !== userId) {
      if (lat === undefined || lng === undefined) {
        throw new NotFoundException('Post is not available at your location');
      }

      const distance = this.distanceMeters(
        lat,
        lng,
        Number(post.latitude),
        Number(post.longitude),
      );
      const isVisible =
        post.status === PostStatus.ACTIVE &&
        post.expires_at.getTime() > Date.now() &&
        distance <= post.visibility_radius;

      if (!isVisible) {
        throw new NotFoundException('Post is not available at your location');
      }
    }

    return this.toPublicPost(post);
  }

  async update(
    postId: number,
    updatePostDto: UpdatePostDto,
    userId: number,
    images: Express.Multer.File[] = [],
  ): Promise<PublicPost> {
    const post = await this.findOne(postId);
    this.assertOwner(post, userId);
    const previousImageUrls = this.extractImageUrls(post);
    const uploadedImages = await this.uploadPostImages(userId, images);

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

    if (uploadedImages.length > 0) {
      post.image_url = uploadedImages[0].url;
    }

    try {
      const savedPost = await this.postsRepository.save(post);

      if (uploadedImages.length > 0) {
        await this.postImagesRepository.delete({ post_id: postId });
        savedPost.images = await this.savePostImages(savedPost, uploadedImages);
        await this.deleteImageUrls(previousImageUrls);
      }

      return this.toPublicPost(savedPost);
    } catch {
      await this.deleteUploadedImages(uploadedImages);
      throw new BadRequestException('Failed to update post');
    }
  }

  async remove(postId: number, userId: number): Promise<{ message: string }> {
    const post = await this.findOne(postId);
    this.assertOwner(post, userId);
    const imageUrls = this.extractImageUrls(post);

    try {
      await this.postsRepository.remove(post);
      await this.deleteImageUrls(imageUrls);
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

  private assertOwner(post: Post, userId: number): void {
    const owner = post.user as { user_id?: number } | null;
    if (Number(owner?.user_id) !== userId) {
      throw new ForbiddenException('You can only manage your own posts');
    }
  }

  private distanceSql(alias: string): string {
    return `
      6371000 * 2 * asin(
        sqrt(
          power(sin(radians((${alias}.latitude::float - :lat) / 2)), 2) +
          cos(radians(:lat)) *
          cos(radians(${alias}.latitude::float)) *
          power(sin(radians((${alias}.longitude::float - :lng) / 2)), 2)
        )
      )
    `;
  }

  private distanceMeters(
    viewerLat: number,
    viewerLng: number,
    postLat: number,
    postLng: number,
  ): number {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const latDifference = toRadians(postLat - viewerLat);
    const lngDifference = toRadians(postLng - viewerLng);
    const startLat = toRadians(viewerLat);
    const endLat = toRadians(postLat);
    const haversine =
      Math.sin(latDifference / 2) ** 2 +
      Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDifference / 2) ** 2;

    return 6371000 * 2 * Math.asin(Math.sqrt(haversine));
  }

  private toPublicPost(post: Post): PublicPost {
    const imageUrls = this.extractImageUrls(post);
    const publicPost = {
      ...post,
      image_url: imageUrls[0] ?? null,
      image_urls: imageUrls,
    } as Partial<Post> & { image_urls: string[] };
    delete publicPost.latitude;
    delete publicPost.longitude;
    return publicPost as PublicPost;
  }

  private async uploadPostImages(
    userId: number,
    images: Express.Multer.File[],
  ): Promise<Array<{ key: string; url: string }>> {
    return Promise.all(
      images.slice(0, 6).map((image) =>
        this.imageStorage.uploadPostImage(userId, image),
      ),
    );
  }

  private async savePostImages(
    post: Post,
    uploadedImages: Array<{ url: string }>,
  ): Promise<PostImage[]> {
    if (uploadedImages.length === 0) return [];

    const rows = uploadedImages.map((image, index) =>
      this.postImagesRepository.create({
        post,
        post_id: post.post_id,
        image_url: image.url,
        display_order: index,
      }),
    );

    return this.postImagesRepository.save(rows);
  }

  private extractImageUrls(post: Post): string[] {
    const galleryUrls = (post.images ?? [])
      .slice()
      .sort((a, b) => a.display_order - b.display_order)
      .map((image) => image.image_url);

    return this.compactUrls([...galleryUrls, post.image_url]);
  }

  private compactUrls(urls: Array<string | null | undefined>): string[] {
    const seen = new Set<string>();

    return urls.filter((url): url is string => {
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
  }

  private isMissingPostImagesTableError(error: unknown): boolean {
    const databaseError = error as { code?: string; message?: string };
    return (
      databaseError.code === '42P01' &&
      Boolean(databaseError.message?.includes('post_images'))
    );
  }

  private async loadImageUrlsForPostIds(
    postIds: number[],
  ): Promise<Map<number, string[]>> {
    if (postIds.length === 0) return new Map();

    const images = await this.postImagesRepository
      .createQueryBuilder('image')
      .leftJoinAndSelect('image.post', 'post')
      .where('post.post_id IN (:...postIds)', { postIds })
      .orderBy('image.display_order', 'ASC')
      .getMany();

    return images.reduce((map, image) => {
      const postId = image.post_id ?? image.post?.post_id;
      if (!postId) return map;

      const urls = map.get(postId) ?? [];
      urls.push(image.image_url);
      map.set(postId, urls);
      return map;
    }, new Map<number, string[]>());
  }

  private async deleteUploadedImages(
    uploadedImages: Array<{ url: string }>,
  ): Promise<void> {
    await this.deleteImageUrls(uploadedImages.map((image) => image.url));
  }

  private async deleteImageUrls(
    imageUrls: Array<string | null | undefined>,
  ): Promise<void> {
    await Promise.all(
      this.compactUrls(imageUrls).map((url) =>
        this.imageStorage.deleteByPublicUrl(url, 'post-images').catch(() => {
          // The database operation should not fail only because storage cleanup
          // needs to be retried later.
        }),
      ),
    );
  }

  private distanceLabel(distance: number): string {
    return `within ${distance}m`;
  }

  private escapeLikePattern(value: string): string {
    return value.replace(/[\\%_]/g, '\\$&');
  }
}
