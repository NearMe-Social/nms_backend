import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,

} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserBlock } from '../../blocks/entities/user-block.entity';
import { Report } from '../../reports/entities/report.entities';
import { Notification } from '../../notifications/entities/notification.entities';
import { ConversationParticipant } from '../../conversations/entities/conversation-participant.entity';


export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum Gender {
  FEMALE = 'female',
  MALE = 'male',
  NON_BINARY = 'non-binary',
  PREFER_NOT = 'prefer-not',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Exclude()
  @Column()
  password_hash: string;

  @Column({ type: 'date', nullable: true })
  birthday: Date | null;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender | null;

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

  @OneToMany(() => ConversationParticipant, (conversationparticipant) => conversationparticipant.user)
  conversationParticipants: ConversationParticipant[];

}
