import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostsScheduler } from './posts.scheduler';
import { Post } from './entities/post.entities';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), ScheduleModule.forRoot()],
  controllers: [PostsController],
  providers: [PostsService, PostsScheduler],
  exports: [PostsService],
})
export class PostsModule {}