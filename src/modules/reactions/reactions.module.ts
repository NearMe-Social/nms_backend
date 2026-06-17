import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';
import { Reaction } from './entities/reaction.entity';
import { Post } from '../posts/entities/post.entities';

@Module({
  imports: [TypeOrmModule.forFeature([Reaction, Post])],
  controllers: [ReactionsController],
  providers: [ReactionsService],
})
export class ReactionsModule {}
