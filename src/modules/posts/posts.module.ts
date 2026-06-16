import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from './entities/post.entities';
import { UsersModule } from '../users/users.module';
import { PostImage } from './entities/post-image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostImage]), UsersModule],
  providers: [PostsService],
  controllers: [PostsController],
})
export class PostsModule {}
