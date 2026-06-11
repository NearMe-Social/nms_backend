import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { Conversation } from './entities/conversation.entities';
import { ConversationsService } from './conversations.service';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let participantRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    participantRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: getRepositoryToken(ConversationParticipant),
          useValue: participantRepository,
        },
        {
          provide: getRepositoryToken(Conversation),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOneOrFail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return unique users who share a conversation', async () => {
    participantRepository.find
      .mockResolvedValueOnce([
        { conversation_id: 10, user_id: 1 },
        { conversation_id: 20, user_id: 1 },
      ])
      .mockResolvedValueOnce([
        { conversation_id: 10, user_id: 1 },
        { conversation_id: 10, user_id: 2 },
        { conversation_id: 20, user_id: 1 },
        { conversation_id: 20, user_id: 2 },
        { conversation_id: 20, user_id: 3 },
      ]);

    await expect(service.getPeerUserIds(1)).resolves.toEqual([2, 3]);
  });
});
