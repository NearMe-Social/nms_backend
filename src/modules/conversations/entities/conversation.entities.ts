import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { ConversationParticipant } from './conversation-participant.entity';
import { Message } from '../../messages/entities/message.entity';
@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn()
  conversation_id: number;

  @Column()
  type: string;

  @OneToMany(() => ConversationParticipant, (p) => p.conversation)
  participants: ConversationParticipant[];

  @OneToMany(() => Message, (m) => m.conversation)
  messages: Message[];
}