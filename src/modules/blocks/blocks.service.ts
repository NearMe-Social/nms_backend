import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBlock } from './entities/user-block.entity';

@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(UserBlock)
    private readonly blockRepo: Repository<UserBlock>,
  ) {}

  async block(blockerId: number, blockedUserId: number): Promise<UserBlock> {
    if (blockerId === blockedUserId) {
      throw new BadRequestException('You cannot block yourself');
    }

    const existing = await this.isBlocked(blockerId, blockedUserId);
    if (existing) {
      throw new ConflictException('User is already blocked');
    }

    const block = this.blockRepo.create({
      blocker: { user_id: blockerId },
      blockedUser: { user_id: blockedUserId },
    });

    return this.blockRepo.save(block);
  }

  async getBlockedUsers(blockerId: number): Promise<BlockedUserListItem[]> {
    const blocks = await this.blockRepo.find({
      where: { blocker: { user_id: blockerId } },
      relations: { blockedUser: true },
      order: { created_at: 'DESC' },
    });

    return blocks.map((block) => ({
      user_block_id: block.user_block_id,
      blocked_user_id: block.blockedUser.user_id,
      username: block.blockedUser.username,
      first_name: block.blockedUser.first_name,
      last_name: block.blockedUser.last_name,
      profile_image: block.blockedUser.profile_image,
      created_at: block.created_at,
    }));
  }

  async unblock(
    blockerId: number,
    blockedUserId: number,
  ): Promise<{ message: string }> {
    const block = await this.blockRepo.findOne({
      where: {
        blocker: { user_id: blockerId },
        blockedUser: { user_id: blockedUserId },
      },
    });

    if (!block) {
      throw new NotFoundException('Block relationship not found');
    }

    await this.blockRepo.remove(block);
    return { message: 'User unblocked successfully' };
  }

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

export interface BlockedUserListItem {
  user_block_id: number;
  blocked_user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_image: string | null;
  created_at: Date;
}
