import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PostsService } from './posts.service';

@Injectable()
export class PostsScheduler {
  private readonly logger = new Logger(PostsScheduler.name);

  constructor(private readonly postsService: PostsService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredPosts() {
    this.logger.log('Running post expiration job...');
    await this.postsService.expireOldPosts();
    this.logger.log('Post expiration job complete.');
  }
}