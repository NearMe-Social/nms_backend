import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { Conversation } from './entities/conversation.entities';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(ConversationParticipant)
    private readonly participantRepo: Repository<ConversationParticipant>,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
  ) {}

  async isParticipant(conversationId: number, userId: number): Promise<boolean> {
    const participant = await this.participantRepo.findOne({
      where: { conversation_id: conversationId, user_id: userId },
    });
    return !!participant;
  }

  async getConversationParticipantIds(conversationId: number): Promise<number[]> {
    const participants = await this.participantRepo.find({
      where: { conversation_id: conversationId },
    });
    return participants.map((p) => p.user_id);
  }
}
