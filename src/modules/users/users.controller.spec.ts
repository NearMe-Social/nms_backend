import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  const usersService = {
    findNearby: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate nearby user queries to the service', async () => {
    const query = { lat: 11.5564, lng: 104.9282, radius: 100 };
    usersService.findNearby.mockResolvedValue([]);

    await expect(
      controller.findNearby(query, { user: { userId: 1 } } as any),
    ).resolves.toEqual([]);
    expect(usersService.findNearby).toHaveBeenCalledWith(query, 1);
  });
});
