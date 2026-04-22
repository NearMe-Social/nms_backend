import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PostStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DELETED = 'deleted',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  post_id: number;

  @Column()
  user_id: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: string;

  @Column({ type: 'int' })
  visibility_radius: number;

  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.ACTIVE })
  status: PostStatus;
 @Column({ type: 'timestamp', nullable: true })
 expires_at: Date | null;
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}