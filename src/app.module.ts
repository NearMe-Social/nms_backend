import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DB_URL'),

        ssl: {
          rejectUnauthorized: false,
        },

        entities: [__dirname + '/**/*.entity{.ts,.js}',
                  __dirname + '/**/*.entities{.ts,.js}'
        ],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],

        synchronize: false,
        migrationsRun: false,

        logging: config.get<string>('NODE_ENV') !== 'production',
      }),
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
