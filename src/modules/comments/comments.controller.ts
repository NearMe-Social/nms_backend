import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entities';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCommentDto: CreateCommentDto): Promise<Comment> {
    return this.commentsService.create(createCommentDto);
  }

  @Get()
  findAll(): Promise<Comment[]> {
    return this.commentsService.findAll();
  }

  @Get('post/:postId')
  findByPost(@Param('postId', ParseIntPipe) postId: number): Promise<Comment[]> {
    return this.commentsService.findByPost(postId);
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number): Promise<Comment[]> {
    return this.commentsService.findByUser(userId);
  }

  @Get('count/:postId')
  countByPost(@Param('postId', ParseIntPipe) postId: number): Promise<number> {
    return this.commentsService.countByPost(postId);
  }

  @Get(':commentId')
  findOne(
    @Param('commentId', ParseIntPipe) commentId: number,
  ): Promise<Comment> {
    return this.commentsService.findOne(commentId);
  }

  @Patch(':commentId')
  update(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    return this.commentsService.update(commentId, updateCommentDto);
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('commentId', ParseIntPipe) commentId: number,
  ): Promise<{ message: string }> {
    return this.commentsService.remove(commentId);
  }
}
