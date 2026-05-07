import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Message} from './entities/message.entity';
import {CreateMessageDto} from './dto/create-message.dto'
import { ConversationParticipant } from '../conversations/entities/conversation-participant.entity';


@Injectable()
export class MessagesService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRopo : Repository<Message>,
        
        @InjectRepository(ConversationParticipant)
        private readonly participantRepo: Repository<ConversationParticipant>,
    ){}

    async sendMessage(userId: number, dto: CreateMessageDto){
        const {conversationId, content} = dto;

        const isParticipant = await this.isUserInConversation(userId, conversationId);
        if(!isParticipant){
            throw new ForbiddenException('User not in conversation');
        }

        const message = this.messageRopo.create({
            conversationId,
            senderId: userId,
            content,
            status: 'SENT',
        });

        return this.messageRopo.save(message);

    }

    async getMessagesByConversation(
        userId: number,
        conversationId: number,
        page = 0,
        size = 20,
    ){
        const isParticipant = await this.isUserInConversation(userId, conversationId);
        if(!isParticipant){
            throw new ForbiddenException('Access denied');
        }

        const [items, total] = await this.messageRopo.findAndCount({
            where: {conversationId},
            order: {createdAt: 'DESC'},
            skip: page * size,
            take: size,
        });

        return{
            total,
            data: items.reverse(),
        };
    }

    async isUserInConversation(userId: number, conversationId: number){
        const participant = await this.participantRepo.findOne({
            where: {
                userId,
                conversationId,
            },
        });

        return Boolean(participant);
    }

    async getLastesMessage(conversationId: number){
        const msg = await this.messageRopo.findOne({
            where: {conversationId},
            order: {createdAt: 'DESC'},
        });

        return msg;
    }

    async markAsSeen(userId: number, conversationId: number){
        const isParticipant = await this.isUserInConversation(userId, conversationId);
        if(!isParticipant){
            throw new ForbiddenException('Access denied');
        }

        await this.messageRopo
            .createQueryBuilder()
            .update(Message)
            .set({
                status: 'SEEN',
                readAt: () => 'CURRENT_TIMESTAMP',
            })
            .where('conversation_id = :conversationId', {conversationId})
            .andWhere('sender_id != :userId', {userId})
            .execute();

            return {success: true};
    }

}
