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
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ParseFilePipeBuilder,
} from '@nestjs/common';
import { NearbyPostsQueryDto } from './dto/nearby-posts-query.dto';
import { PostsQueryDto } from './dto/posts-query.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SearchPostsQueryDto } from './dto/search-posts-query.dto';
import { VisiblePostQueryDto } from './dto/visible-post-query.dto';
import { Post } from './entities/post.entities';
import { NearbyPostResponse, PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: number; role: string };
}

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @HttpPost()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  create(
    @Body() createPostDto: CreatePostDto,
    @Req() req: RequestWithUser,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
        .addFileTypeValidator({
          fileType: /image\/(jpeg|png|webp)/,
        })
        .build({
          fileIsRequired: false,
        }),
    )
    image?: Express.Multer.File,
  ): Promise<Post> {
    return this.postsService.create(createPostDto, req.user.userId, image);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  findAll(@Query() query: PostsQueryDto): Promise<Post[]> {
    return this.postsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@Req() req: RequestWithUser) {
    return this.postsService.findMine(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  search(@Query() query: SearchPostsQueryDto) {
    return this.postsService.search(query.q, query.lat, query.lng);
  }

  @UseGuards(JwtAuthGuard)
  @Get('nearby')
  findNearby(
    @Query() query: NearbyPostsQueryDto,
  ): Promise<NearbyPostResponse[]> {
    return this.postsService.findNearby(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':postId')
  findOne(
    @Param('postId', ParseIntPipe) postId: number,
    @Query() query: VisiblePostQueryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.postsService.findVisibleOne(
      postId,
      req.user.userId,
      query.lat,
      query.lng,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':postId')
  update(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: RequestWithUser,
  ): Promise<Post> {
    return this.postsService.update(postId, updatePostDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':postId')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    return this.postsService.remove(postId, req.user.userId);
  }
}
