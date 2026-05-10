import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

describe('PostsController', () => {
  let controller: PostsController;
  const postsService = {
    findNearby: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: postsService,
        },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate nearby post queries to the service', async () => {
    const query = {
      lat: 11.5564,
      lng: 104.9282,
      radius: 200,
      sort: 'latest' as const,
    };
    postsService.findNearby.mockResolvedValue([]);

    await expect(controller.findNearby(query)).resolves.toEqual([]);
    expect(postsService.findNearby).toHaveBeenCalledWith(query);
  });
});
