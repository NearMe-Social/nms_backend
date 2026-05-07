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

import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { ConversationsService } from '../conversations/conversations.service';
import { BlocksService } from '../blocks/blocks.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly conversationsService: ConversationsService,
    private readonly blocksService: BlocksService,
  ) {}

  async sendMessage(senderId: number, conversationId: number, content: string): Promise<Message> {
    // Check sender is a participant
    const isParticipant = await this.conversationsService.isParticipant(conversationId, senderId);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }

    // Check if any other participant has blocked or is blocked by sender
    const participantIds = await this.conversationsService.getConversationParticipantIds(conversationId);
    for (const participantId of participantIds) {
      if (participantId === senderId) continue;
      const blocked = await this.blocksService.isEitherBlocked(senderId, participantId);
      if (blocked) {
        throw new ForbiddenException('You cannot send messages in this conversation due to a block');
      }
    }

    const message = this.messageRepo.create({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
    });
    return this.messageRepo.save(message);
  }

  async getMessages(userId: number, conversationId: number): Promise<Message[]> {
    // Check user is a participant before returning messages
    const isParticipant = await this.conversationsService.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }

    return this.messageRepo.find({
      where: { conversation_id: conversationId },
      order: { created_at: 'ASC' },
      relations: ['sender'],
    });
  }
}
