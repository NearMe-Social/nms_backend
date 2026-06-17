import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

describe('PostsController', () => {
  let controller: PostsController;
  const postsService = {
    findNearby: jest.fn(),
    findByUserVisible: jest.fn(),
    create: jest.fn(),
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
    const request = {
      user: { userId: 7 },
    } as Parameters<PostsController['findNearby']>[1];

    await expect(controller.findNearby(query, request)).resolves.toEqual([]);
    expect(postsService.findNearby).toHaveBeenCalledWith(query, 7);
  });

  it('should create a post for the authenticated user', async () => {
    const dto = {
      title: 'Local update',
      content: 'A useful neighborhood update',
      latitude: 11.5564,
      longitude: 104.9282,
      visibility_radius: 100,
      expires_at: '2026-06-11T10:00:00.000Z',
    };
    postsService.create.mockResolvedValue({ post_id: 1 });
    const request = {
      user: { userId: 7 },
    } as Parameters<PostsController['create']>[1];

    await expect(controller.create(dto, request)).resolves.toEqual({
      post_id: 1,
    });
    expect(postsService.create).toHaveBeenCalledWith(dto, 7, []);
  });

  it('should delegate privacy-aware user post queries', async () => {
    const query = { lat: 11.5564, lng: 104.9282, limit: 3 };
    postsService.findByUserVisible.mockResolvedValue([]);
    const request = {
      user: { userId: 7 },
    } as Parameters<PostsController['findByUser']>[2];

    await expect(controller.findByUser(8, query, request)).resolves.toEqual([]);
    expect(postsService.findByUserVisible).toHaveBeenCalledWith(
      8,
      7,
      11.5564,
      104.9282,
      3,
    );
  });
});
