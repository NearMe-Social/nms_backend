import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reaction, ReactionType } from './entities/reaction.entity';
import { Post, PostStatus } from '../posts/entities/post.entities';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(Reaction)
    private readonly reactionsRepository: Repository<Reaction>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  async togglePostReaction(
    postId: number,
    userId: number,
    type: ReactionType = ReactionType.LIKE,
  ): Promise<PostReactionToggleResponse> {
    const post = await this.postsRepository.findOne({
      where: { post_id: postId, status: PostStatus.ACTIVE },
    });

    if (!post || post.expires_at.getTime() <= Date.now()) {
      throw new NotFoundException('Post is not available');
    }

    const existing = await this.reactionsRepository.findOne({
      where: {
        post: { post_id: postId },
        user: { user_id: userId },
      },
    });

    if (existing) {
      await this.reactionsRepository.remove(existing);
      return {
        liked: false,
        reactions_count: await this.countByPost(postId),
      };
    }

    const reaction = this.reactionsRepository.create({
      type,
      post: { post_id: postId },
      user: { user_id: userId },
    });
    await this.reactionsRepository.save(reaction);

    return {
      liked: true,
      reactions_count: await this.countByPost(postId),
    };
  }

  countByPost(postId: number): Promise<number> {
    return this.reactionsRepository.count({
      where: { post: { post_id: postId } },
    });
  }
}

export interface PostReactionToggleResponse {
  liked: boolean;
  reactions_count: number;
}
