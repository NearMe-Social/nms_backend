import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entities';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<Post> {
    try {
      const post = this.postsRepository.create({
        content: createPostDto.content,
        expires_at: new Date(createPostDto.expires_at),
        user: { user_id: createPostDto.user_id },
      });

      return await this.postsRepository.save(post);
    } catch {
      throw new BadRequestException('Failed to create post');
    }
  }

  findAll(): Promise<Post[]> {
    return this.postsRepository.find({
      relations: ['user', 'comments', 'reactions'],
      order: { created_at: 'DESC' },
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

    if (updatePostDto.content !== undefined) {
      post.content = updatePostDto.content;
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
}
