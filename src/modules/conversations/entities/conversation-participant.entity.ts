import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entities';
import { User } from '../../users/entities/user.entity';

@Entity('conversation_participants')
export class ConversationParticipant {
  @PrimaryGeneratedColumn()
  conversation_participant_id: number;

  @Column()
  conversation_id: number;

  @Column()
  user_id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joined_at: Date;

  
  @ManyToOne(
    () => Conversation,
    (conversation) => conversation.participants,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  
  @ManyToOne(
    () => User,
    (user) => user.conversationParticipants,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'user_id' })
  user: User;
}