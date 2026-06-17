import { Test, TestingModule } from '@nestjs/testing';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('BlocksController', () => {
  let controller: BlocksController;
  let service: {
    block: jest.Mock;
    unblock: jest.Mock;
    getBlockedUsers: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      block: jest.fn(),
      unblock: jest.fn(),
      getBlockedUsers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlocksController],
      providers: [{ provide: BlocksService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BlocksController>(BlocksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('blocks a user as the authenticated user', async () => {
    service.block.mockResolvedValue({ user_block_id: 1 });

    await expect(
      controller.block(
        { user: { userId: 5 } } as any,
        { blocked_user_id: 9 },
      ),
    ).resolves.toEqual({ user_block_id: 1 });

    expect(service.block).toHaveBeenCalledWith(5, 9);
  });

  it('lists blocked users for the authenticated user', async () => {
    service.getBlockedUsers.mockResolvedValue([{ blocked_user_id: 9 }]);

    await expect(
      controller.getMyBlockedUsers({ user: { userId: 5 } } as any),
    ).resolves.toEqual([{ blocked_user_id: 9 }]);

    expect(service.getBlockedUsers).toHaveBeenCalledWith(5);
  });

  it('unblocks a user as the authenticated user', async () => {
    service.unblock.mockResolvedValue({ message: 'User unblocked successfully' });

    await expect(
      controller.unblock({ user: { userId: 5 } } as any, 9),
    ).resolves.toEqual({ message: 'User unblocked successfully' });

    expect(service.unblock).toHaveBeenCalledWith(5, 9);
  });
});
