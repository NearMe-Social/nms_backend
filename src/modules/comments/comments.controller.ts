import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * Create a new comment
   * POST /comments
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCommentDto: CreateCommentDto): Promise<Comment> {
    return await this.commentsService.create(createCommentDto);
  }

  /**
   * Get all comments
   * GET /comments
   */
  @Get()
  async findAll(): Promise<Comment[]> {
    return await this.commentsService.findAll();
  }

  /**
   * Get comments by post ID
   * GET /comments/post/:postId
   */
  @Get('post/:postId')
  async getCommentsByPost(@Param('postId') postId: string): Promise<Comment[]> {
    return await this.commentsService.getCommentsByPost(postId);
  }

  /**
   * Get comments by user ID
   * GET /comments/user/:userId
   */
  @Get('user/:userId')
  async getCommentsByUser(@Param('userId') userId: string): Promise<Comment[]> {
    return await this.commentsService.getCommentsByUser(userId);
  }

  /**
   * Get comment count for a post
   * GET /comments/count/:postId
   */
  @Get('count/:postId')
  async getCommentCount(@Param('postId') postId: string): Promise<number> {
    return await this.commentsService.getCommentCount(postId);
  }

  /**
   * Get a single comment by ID
   * GET /comments/:commentId
   */
  @Get(':commentId')
  async getCommentById(@Param('commentId') commentId: string): Promise<Comment> {
    return await this.commentsService.getCommentById(commentId);
  }

  /**
   * Update a comment
   * PUT /comments/:commentId
   */
  @Put(':commentId')
  async update(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    return await this.commentsService.update(commentId, updateCommentDto);
  }

  /**
   * Delete a comment
   * DELETE /comments/:commentId
   */
  @Delete(':commentId')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('commentId') commentId: string,
  ): Promise<{ message: string }> {
    return await this.commentsService.delete(commentId);
  }
}


