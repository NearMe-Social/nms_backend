import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBlock } from './entities/user-block.entity';

@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(UserBlock)
    private readonly blockRepo: Repository<UserBlock>,
  ) {}

  async isBlocked(blockerId: number, blockedUserId: number): Promise<boolean> {
    const block = await this.blockRepo.findOne({
      where: {
        blocker: { user_id: blockerId },
        blockedUser: { user_id: blockedUserId },
      },
    });
    return !!block;
  }

  async isEitherBlocked(userA: number, userB: number): Promise<boolean> {
    const [ab, ba] = await Promise.all([
      this.isBlocked(userA, userB),
      this.isBlocked(userB, userA),
    ]);
    return ab || ba;
  }
}
