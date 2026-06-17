import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserBlock } from './entities/user-block.entity';
import { BlocksService } from './blocks.service';

describe('BlocksService', () => {
  let service: BlocksService;
  let repo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((block) => block),
      save: jest.fn(async (block) => ({ user_block_id: 1, ...block })),
      find: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlocksService,
        {
          provide: getRepositoryToken(UserBlock),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<BlocksService>(BlocksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('blocks another user', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.block(1, 2)).resolves.toMatchObject({
      user_block_id: 1,
      blocker: { user_id: 1 },
      blockedUser: { user_id: 2 },
    });

    expect(repo.create).toHaveBeenCalledWith({
      blocker: { user_id: 1 },
      blockedUser: { user_id: 2 },
    });
  });

  it('does not block yourself', async () => {
    await expect(service.block(1, 1)).rejects.toThrow('You cannot block yourself');
  });

  it('lists blocked users without exposing private fields', async () => {
    repo.find.mockResolvedValue([
      {
        user_block_id: 10,
        created_at: new Date('2026-06-18T00:00:00Z'),
        blockedUser: {
          user_id: 2,
          username: 'neighbor',
          first_name: 'Near',
          last_name: 'Me',
          profile_image: null,
          email: 'private@example.com',
        },
      },
    ]);

    await expect(service.getBlockedUsers(1)).resolves.toEqual([
      {
        user_block_id: 10,
        blocked_user_id: 2,
        username: 'neighbor',
        first_name: 'Near',
        last_name: 'Me',
        profile_image: null,
        created_at: new Date('2026-06-18T00:00:00Z'),
      },
    ]);

    expect(repo.find).toHaveBeenCalledWith({
      where: { blocker: { user_id: 1 } },
      relations: { blockedUser: true },
      order: { created_at: 'DESC' },
    });
  });

  it('unblocks an existing user', async () => {
    const block = { user_block_id: 1 };
    repo.findOne.mockResolvedValue(block);

    await expect(service.unblock(1, 2)).resolves.toEqual({
      message: 'User unblocked successfully',
    });
    expect(repo.remove).toHaveBeenCalledWith(block);
  });
});
