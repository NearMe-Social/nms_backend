import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
  ) {}

  /**
   * Create a new comment
   */
  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    try {
      const comment = this.commentsRepository.create(createCommentDto);
      return await this.commentsRepository.save(comment);
    } catch (error) {
      throw new BadRequestException('Failed to create comment');
    }
  }

  /**
   * Get all comments
   */
  async findAll(): Promise<Comment[]> {
    return await this.commentsRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get all comments by post ID
   */
  async getCommentsByPost(postId: string): Promise<Comment[]> {
    if (!postId) {
      throw new BadRequestException('Post ID is required');
    }

    const comments = await this.commentsRepository.find({
      where: { post_id: postId },
      order: { created_at: 'DESC' },
    });

    return comments;
  }

  /**
   * Get a single comment by ID
   */
  async getCommentById(commentId: string): Promise<Comment> {
    if (!commentId) {
      throw new BadRequestException('Comment ID is required');
    }

    const comment = await this.commentsRepository.findOne({
      where: { comment_id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    return comment;
  }

  /**
   * Update a comment
   */
  async update(
    commentId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    const comment = await this.getCommentById(commentId);

    if (updateCommentDto.content) {
      comment.content = updateCommentDto.content;
    }

    try {
      return await this.commentsRepository.save(comment);
    } catch (error) {
      throw new BadRequestException('Failed to update comment');
    }
  }

  /**
   * Delete a comment
   */
  async delete(commentId: string): Promise<{ message: string }> {
    const comment = await this.getCommentById(commentId);

    try {
      await this.commentsRepository.remove(comment);
      return { message: 'Comment deleted successfully' };
    } catch (error) {
      throw new BadRequestException('Failed to delete comment');
    }
  }

  /**
   * Get comment count for a post
   */
  async getCommentCount(postId: string): Promise<number> {
    if (!postId) {
      throw new BadRequestException('Post ID is required');
    }

    return await this.commentsRepository.count({
      where: { post_id: postId },
    });
  }

  /**
   * Get comments by user ID
   */
  async getCommentsByUser(userId: string): Promise<Comment[]> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    return await this.commentsRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }
}
