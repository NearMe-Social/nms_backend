import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBlock } from './entities/user-block.entity';
import { CreateBlockDto } from './dto/create-block.dto';

@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(UserBlock)
    private readonly blockRepo: Repository<UserBlock>,
  ) {}

    async block(createBlockDto: CreateBlockDto): Promise<UserBlock> {
    const { blocker_id, blocked_user_id } = createBlockDto;
 
    if (blocker_id === blocked_user_id) {
      throw new BadRequestException('You cannot block yourself');
    }
 
    const existing = await this.isBlocked(blocker_id, blocked_user_id);
    if (existing) {
      throw new ConflictException('User is already blocked');
    }
 
    const block = this.blockRepo.create({
      blocker: { user_id: blocker_id },
      blockedUser: { user_id: blocked_user_id },
    });
 
    return this.blockRepo.save(block);
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
