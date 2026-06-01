import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entities';
import { Post } from '../posts/entities/post.entities';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Post]), NotificationsModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
