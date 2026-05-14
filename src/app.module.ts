import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PostsModule } from './modules/posts/posts.module';
import { CommentsModule } from './modules/comments/comments.module';
import { BlocksModule } from './modules/blocks/blocks.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmConfig()),
    UsersModule,
    AuthModule,
    PostsModule,
    CommentsModule,
    BlocksModule,
    ReportsModule,
    MessagesModule,
    ConversationsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
