import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlocksService } from '../blocks/blocks.service';
import { ConversationsService } from '../conversations/conversations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entities';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly conversationsService: ConversationsService,
    private readonly blocksService: BlocksService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async sendMessage(
    senderId: number,
    conversationId: number,
    dto: CreateMessageDto,
  ): Promise<Message> {
    await this.ensureCanAccessConversation(senderId, conversationId);

    const participantIds =
      await this.conversationsService.getConversationParticipantIds(
        conversationId,
      );

    for (const participantId of participantIds) {
      if (participantId === senderId) continue;
      const blocked = await this.blocksService.isEitherBlocked(
        senderId,
        participantId,
      );
      if (blocked) {
        throw new ForbiddenException(
          'You cannot send messages in this conversation due to a block',
        );
      }
    }

    const message = this.messageRepo.create({
      conversation_id: conversationId,
      sender_id: senderId,
      content: dto.content,
    });

    const savedMessage = await this.messageRepo.save(message);
    const recipientIds = participantIds.filter(
      (participantId) => participantId !== senderId,
    );

    await Promise.all(
      recipientIds.map((recipientId) =>
        this.notificationsService.createNotification({
          user_id: recipientId,
          type: NotificationType.MESSAGE,
          related_id: savedMessage.message_id,
          message: 'New message',
        }),
      ),
    );

    return savedMessage;
  }

  async getMessages(
    userId: number,
    conversationId: number,
    query: QueryMessagesDto = new QueryMessagesDto(),
  ): Promise<{ total: number; data: Message[] }> {
    await this.ensureCanAccessConversation(userId, conversationId);

    const page = query.page ?? 0;
    const size = query.size ?? 20;

    const [items, total] = await this.messageRepo.findAndCount({
      where: { conversation_id: conversationId },
      order: { created_at: 'DESC' },
      skip: page * size,
      take: size,
      relations: ['sender'],
    });

    return {
      total,
      data: items.reverse(),
    };
  }

  async markAsSeen(
    userId: number,
    conversationId: number,
  ): Promise<{ success: true }> {
    await this.ensureCanAccessConversation(userId, conversationId);

    await this.messageRepo
      .createQueryBuilder()
      .update(Message)
      .set({ read_at: () => 'CURRENT_TIMESTAMP' })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('sender_id != :userId', { userId })
      .andWhere('read_at IS NULL')
      .execute();

    return { success: true };
  }

  private async ensureCanAccessConversation(
    userId: number,
    conversationId: number,
  ) {
    const isParticipant = await this.conversationsService.isParticipant(
      conversationId,
      userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant of this conversation',
      );
    }
  }
}
