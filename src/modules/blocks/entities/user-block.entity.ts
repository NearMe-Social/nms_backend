import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_blocks')
@Unique(['blocker', 'blockedUser'])
export class UserBlock {
  @PrimaryGeneratedColumn()
  user_block_id: number;

  @ManyToOne(() => User, (user) => user.blocksInitiated, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'blocker_id' })
  blocker: User;

  @ManyToOne(() => User, (user) => user.blocksReceived, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'blocked_user_id' })
  blockedUser: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
