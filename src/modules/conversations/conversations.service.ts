import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateConversationDto } from './dto/create-conversation.dto';
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

  async create(
    creatorId: number,
    dto: CreateConversationDto,
  ): Promise<Conversation> {
    const participantIds = Array.from(
      new Set([creatorId, ...dto.participantIds]),
    ).sort((a, b) => a - b);

    const existingConversationId =
      await this.findExistingConversationId(participantIds);

    if (existingConversationId) {
      return this.findOneForUser(existingConversationId, creatorId);
    }

    const conversation = await this.conversationRepo.save(
      this.conversationRepo.create(),
    );

    const participants = participantIds.map((userId) =>
      this.participantRepo.create({
        conversation_id: conversation.conversation_id,
        user_id: userId,
      }),
    );

    await this.participantRepo.save(participants);

    return this.findOneForUser(conversation.conversation_id, creatorId);
  }

  async findForUser(userId: number): Promise<Conversation[]> {
    const participations = await this.participantRepo.find({
      where: { user_id: userId },
      order: { joined_at: 'DESC' },
    });

    const conversationIds = participations.map(
      (participant) => participant.conversation_id,
    );

    if (conversationIds.length === 0) return [];

    return this.conversationRepo.find({
      where: { conversation_id: In(conversationIds) },
      relations: ['participants', 'participants.user', 'messages'],
      order: { updated_at: 'DESC' },
    });
  }

  async findOneForUser(
    conversationId: number,
    userId: number,
  ): Promise<Conversation> {
    await this.assertParticipant(conversationId, userId);

    return this.conversationRepo.findOneOrFail({
      where: { conversation_id: conversationId },
      relations: ['participants', 'participants.user', 'messages'],
    });
  }

  async isParticipant(
    conversationId: number,
    userId: number,
  ): Promise<boolean> {
    const participant = await this.participantRepo.findOne({
      where: { conversation_id: conversationId, user_id: userId },
    });

    return !!participant;
  }

  async getConversationParticipantIds(
    conversationId: number,
  ): Promise<number[]> {
    const participants = await this.participantRepo.find({
      where: { conversation_id: conversationId },
    });

    return participants.map((participant) => participant.user_id);
  }

  async getPeerUserIds(userId: number): Promise<number[]> {
    const userParticipations = await this.participantRepo.find({
      where: { user_id: userId },
    });
    const conversationIds = Array.from(
      new Set(
        userParticipations.map((participant) => participant.conversation_id),
      ),
    );

    if (conversationIds.length === 0) return [];

    const participants = await this.participantRepo.find({
      where: { conversation_id: In(conversationIds) },
    });

    return Array.from(
      new Set(
        participants
          .map((participant) => participant.user_id)
          .filter((participantId) => participantId !== userId),
      ),
    );
  }

  async touchConversation(conversationId: number): Promise<void> {
    await this.conversationRepo.update(conversationId, {
      updated_at: new Date(),
    });
  }

  private async findExistingConversationId(
    participantIds: number[],
  ): Promise<number | null> {
    const matchingParticipants = await this.participantRepo.find({
      where: { user_id: In(participantIds) },
    });

    const candidateConversationIds = Array.from(
      new Set(
        matchingParticipants.map((participant) => participant.conversation_id),
      ),
    );

    for (const conversationId of candidateConversationIds) {
      const participants = await this.participantRepo.find({
        where: { conversation_id: conversationId },
      });
      const ids = participants
        .map((participant) => participant.user_id)
        .sort((a, b) => a - b);

      if (
        ids.length === participantIds.length &&
        ids.every((id, index) => id === participantIds[index])
      ) {
        return conversationId;
      }
    }

    return null;
  }

  private async assertParticipant(conversationId: number, userId: number) {
    const isParticipant = await this.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new ForbiddenException('Conversation not found or access denied');
    }
  }
}
