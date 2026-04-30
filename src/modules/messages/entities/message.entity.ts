import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

import { Conversation } from '../../conversations/entities/conversation.entities';

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn()
    message_id: number;

    @Column()
    conversation_id: number;

    @Column()
    sender_id: number;

    @Column()
    content: string;

    @ManyToOne(() => Conversation, (c) => c.messages)
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;
}