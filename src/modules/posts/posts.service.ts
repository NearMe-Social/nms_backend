import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostStatus } from './entities/post.entities';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { NearbyPostsDto } from './dto/nearby-posts.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  async create(userId: number, createPostDto: CreatePostDto): Promise<Post> {
    const post = this.postsRepository.create({
      title: createPostDto.title,
      content: createPostDto.content,
      latitude: createPostDto.latitude,
      longitude: createPostDto.longitude,
      visibility_radius: createPostDto.visibility_radius,
      expires_at: createPostDto.expires_at ? new Date(createPostDto.expires_at) : null,
      user_id: userId,
      status: PostStatus.ACTIVE,
    });

    return this.postsRepository.save(post);
  }

  async findNearby(nearbyPostsDto: NearbyPostsDto): Promise<Post[]> {
    const { latitude, longitude, radius } = nearbyPostsDto;

    return await this.postsRepository
      .createQueryBuilder('post')
      .where('post.status = :status', { status: PostStatus.ACTIVE })
      .andWhere('(post.expires_at IS NULL OR post.expires_at > NOW())')
      .andWhere(
        `(6371000 * acos(
          cos(radians(:latitude)) * cos(radians(CAST(post.latitude AS FLOAT)))
          * cos(radians(CAST(post.longitude AS FLOAT)) - radians(:longitude))
          + sin(radians(:latitude)) * sin(radians(CAST(post.latitude AS FLOAT)))
        )) <= post.visibility_radius`,
        { latitude, longitude }
      )
      .orderBy('post.created_at', 'DESC')
      .getMany();
  }

  async findOne(postId: number): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { post_id: postId, status: PostStatus.ACTIVE },
      relations: ['user'],
    });

    if (!post) {
      throw new NotFoundException(`Post #${postId} not found`);
    }

    return post;
  }

  async update(userId: number, postId: number, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(postId); 

    if (post.user_id !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    const updatedPost = this.postsRepository.merge(post, {
      ...updatePostDto,
      expires_at: updatePostDto.expires_at ? new Date(updatePostDto.expires_at) : post.expires_at
    });

    return this.postsRepository.save(updatedPost);
  }

  async remove(userId: number, postId: number): Promise<void> {
    const post = await this.postsRepository.findOne({
      where: { post_id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post #${postId} not found`);
    }

    if (post.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    post.status = PostStatus.DELETED;
    await this.postsRepository.save(post);
  }

  async expireOldPosts(): Promise<void> {
    await this.postsRepository
      .createQueryBuilder()
      .update(Post)
      .set({ status: PostStatus.EXPIRED })
      .where('expires_at IS NOT NULL')
      .andWhere('expires_at <= NOW()')
      .andWhere('status = :status', { status: PostStatus.ACTIVE })
      .execute();
  }
}