import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn
} from 'typeorm';

import { Conversation } from '../../conversations/entities/conversation.entities';

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn({name: 'message_id'})
    messageId!: number;

    @Column({name : 'conversation_id'})
    conversationId!: number;

    @Column({name: 'sender_id'})
    senderId!: number;

    @Column({type: 'text'})
    content!: string;

    @Column({type: 'varchar', length: 20, default: 'SENT'})
    status!: 'SENT' | 'DELIVERD' | 'SEEN';

    @Column({name: 'read_at', type: 'timestamp', nullable: true})
    readAt? : Date;

    @CreateDateColumn({name : 'create_at'})
    createdAt! : Date;

    @ManyToOne(() => Conversation, (c) => c.messages)
    @JoinColumn({ name: 'conversation_id' })
    conversation!: Conversation;
}