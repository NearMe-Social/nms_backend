import { Test, TestingModule } from '@nestjs/testing';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('ReactionsController', () => {
  let controller: ReactionsController;
  let reactionsService: {
    togglePostReaction: jest.Mock;
  };

  beforeEach(async () => {
    reactionsService = {
      togglePostReaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReactionsController],
      providers: [
        {
          provide: ReactionsService,
          useValue: reactionsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReactionsController>(ReactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('toggles a post reaction as the authenticated user', async () => {
    reactionsService.togglePostReaction.mockResolvedValue({
      liked: true,
      reactions_count: 3,
    });

    await expect(
      controller.togglePostReaction(8, { user: { userId: 4 } } as any),
    ).resolves.toEqual({
      liked: true,
      reactions_count: 3,
    });

    expect(reactionsService.togglePostReaction).toHaveBeenCalledWith(8, 4);
  });
});
