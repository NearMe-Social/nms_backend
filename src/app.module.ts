import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.DB_PORT as string) || 5432,
      username: process.env.DB_USERNAME || 'nearme_user',
      password: process.env.DB_PASSWORD || 'nearme_pass',
      database: process.env.DB_NAME || 'nearme_social',
      entities: [__dirname + '/**/*.{entity,entities}{.ts,.js}'],
      logging: true,
    }),
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
