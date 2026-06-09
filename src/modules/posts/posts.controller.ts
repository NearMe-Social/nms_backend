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
  Post as HttpPost,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NearbyPostsQueryDto } from './dto/nearby-posts-query.dto';
import { PostsQueryDto } from './dto/posts-query.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SearchPostsQueryDto } from './dto/search-posts-query.dto';
import { Post } from './entities/post.entities';
import { NearbyPostResponse, PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @HttpPost()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPostDto: CreatePostDto): Promise<Post> {
    return this.postsService.create(createPostDto);
  }

  @Get()
  findAll(@Query() query: PostsQueryDto): Promise<Post[]> {
    return this.postsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  search(@Query() query: SearchPostsQueryDto): Promise<Post[]> {
    return this.postsService.search(query.q);
  }

  @Get('nearby')
  findNearby(
    @Query() query: NearbyPostsQueryDto,
  ): Promise<NearbyPostResponse[]> {
    return this.postsService.findNearby(query);
  }

  @Get(':postId')
  findOne(@Param('postId', ParseIntPipe) postId: number): Promise<Post> {
    return this.postsService.findOne(postId);
  }

  @Patch(':postId')
  update(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<Post> {
    return this.postsService.update(postId, updatePostDto);
  }

  @Delete(':postId')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('postId', ParseIntPipe) postId: number,
  ): Promise<{ message: string }> {
    return this.postsService.remove(postId);
  }
}
