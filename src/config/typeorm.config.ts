import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Comment } from '../modules/comments/entities/comment.entities';
import { Post } from '../modules/posts/entities/post.entities';
import { Reaction } from '../modules/reactions/entities/reaction.entity';
import { User } from '../modules/users/entities/user.entity';

export const typeOrmConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? '',
  database: process.env.DB_NAME ?? 'proximity_db',
  entities: [User, Post, Comment, Reaction],
  synchronize: true, // Set to false in production
  logging: false,
});
