import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReactionsService } from './reactions.service';
import { Reaction } from './entities/reaction.entity';
import { Post } from '../posts/entities/post.entities';

describe('ReactionsService', () => {
  let service: ReactionsService;
  let reactionsRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    count: jest.Mock;
  };
  let postsRepository: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    reactionsRepository = {
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(),
      remove: jest.fn(),
      count: jest.fn().mockResolvedValue(1),
    };
    postsRepository = {
      findOne: jest.fn().mockResolvedValue({
        post_id: 7,
        status: 'ACTIVE',
        expires_at: new Date(Date.now() + 60_000),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionsService,
        {
          provide: getRepositoryToken(Reaction),
          useValue: reactionsRepository,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: postsRepository,
        },
      ],
    }).compile();

    service = module.get<ReactionsService>(ReactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('likes a post when the user has not reacted yet', async () => {
    reactionsRepository.findOne.mockResolvedValue(null);
    reactionsRepository.count.mockResolvedValue(5);

    await expect(service.togglePostReaction(7, 3)).resolves.toEqual({
      liked: true,
      reactions_count: 5,
    });

    expect(reactionsRepository.create).toHaveBeenCalledWith({
      type: 'LIKE',
      post: { post_id: 7 },
      user: { user_id: 3 },
    });
    expect(reactionsRepository.save).toHaveBeenCalled();
  });

  it('unlikes a post when the user already reacted', async () => {
    const existingReaction = { reaction_id: 11 };
    reactionsRepository.findOne.mockResolvedValue(existingReaction);
    reactionsRepository.count.mockResolvedValue(4);

    await expect(service.togglePostReaction(7, 3)).resolves.toEqual({
      liked: false,
      reactions_count: 4,
    });

    expect(reactionsRepository.remove).toHaveBeenCalledWith(existingReaction);
  });

  it('rejects unavailable posts', async () => {
    postsRepository.findOne.mockResolvedValue(null);

    await expect(service.togglePostReaction(7, 3)).rejects.toThrow(
      'Post is not available',
    );
  });
});
