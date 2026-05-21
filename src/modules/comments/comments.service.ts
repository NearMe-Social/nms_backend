import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment, CommentStatus } from './entities/comment.entities';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
  ) {}

  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    try {
      const comment = this.commentsRepository.create({
        content: createCommentDto.content,
        post: { post_id: createCommentDto.post_id },
        user: { user_id: createCommentDto.user_id },
      });

      return await this.commentsRepository.save(comment);
    } catch {
      throw new BadRequestException('Failed to create comment');
    }
  }

  findAll(): Promise<Comment[]> {
    return this.commentsRepository.find({
      relations: ['post', 'user'],
      order: { created_at: 'DESC' },
    });
  }

  findByPost(postId: number): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { post: { post_id: postId }, status: CommentStatus.ACTIVE },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  findByUser(userId: number): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { user: { user_id: userId }, status: CommentStatus.ACTIVE },
      relations: ['post'],
      order: { created_at: 'DESC' },
    });
  }

  countByPost(postId: number): Promise<number> {
    return this.commentsRepository.count({
      where: { post: { post_id: postId }, status: CommentStatus.ACTIVE },
    });
  }

  async findOne(commentId: number): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { comment_id: commentId },
      relations: ['post', 'user'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    return comment;
  }

  async update(
    commentId: number,
    updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    const comment = await this.findOne(commentId);

    if (updateCommentDto.content !== undefined) {
      comment.content = updateCommentDto.content;
    }

    try {
      return await this.commentsRepository.save(comment);
    } catch {
      throw new BadRequestException('Failed to update comment');
    }
  }

  async remove(commentId: number): Promise<{ message: string }> {
    const comment = await this.findOne(commentId);

    try {
      await this.commentsRepository.remove(comment);
      return { message: 'Comment deleted successfully' };
    } catch {
      throw new BadRequestException('Failed to delete comment');
    }
  }
}
