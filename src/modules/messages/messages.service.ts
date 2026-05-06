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
