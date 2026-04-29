import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password_hash: string;

   @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ nullable: true })
  profile_image: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  current_latitude: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  current_longitude: number;

  @Column({ type: 'timestamp', nullable: true })
  location_updated_at: Date;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToMany(() => UserBlock, (block) => block.blocker)
  blocksInitiated: UserBlock[];

  @OneToMany(() => UserBlock, (block) => block.blockedUser)
  blocksReceived: UserBlock[];

  @OneToMany(() => Report, (report) => report.reporter)
  reports: Report[];

  @OneToMany(() => Report, (report) => report.reviewedBy)
  reviewedReports: Report[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
