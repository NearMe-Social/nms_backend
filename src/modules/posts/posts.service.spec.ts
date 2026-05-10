import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post } from './entities/post.entities';
import { PostsService } from './posts.service';

describe('PostsService', () => {
  let service: PostsService;
  let queryBuilder: {
    leftJoinAndSelect: jest.Mock;
    leftJoin: jest.Mock;
    select: jest.Mock;
    addSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    groupBy: jest.Mock;
    addGroupBy: jest.Mock;
    having: jest.Mock;
    andHaving: jest.Mock;
    setParameters: jest.Mock;
    orderBy: jest.Mock;
    addOrderBy: jest.Mock;
    getMany: jest.Mock;
    getRawMany: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      andHaving: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getRawMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return nearby posts with approximate distance and no exact coordinates', async () => {
    queryBuilder.getRawMany.mockResolvedValue([
      {
        post_id: 1,
        title: 'Road repair',
        content: 'Elm Street is slow tonight',
        visibility_radius: 200,
        status: 'ACTIVE',
        expires_at: new Date('2026-05-07T00:00:00Z'),
        created_at: new Date('2026-05-06T10:00:00Z'),
        updated_at: new Date('2026-05-06T10:00:00Z'),
        user_id: 2,
        username: 'alex',
        profile_image: null,
        comments_count: '2',
        reactions_count: '3',
        distance_m: '123.4',
      },
    ]);

    const result = await service.findNearby({
      lat: 11.5564,
      lng: 104.9282,
      radius: 200,
    });

    expect(queryBuilder.setParameters).toHaveBeenCalledWith({
      lat: 11.5564,
      lng: 104.9282,
      radius: 200,
    });
    expect(result).toEqual([
      {
        post_id: 1,
        title: 'Road repair',
        content: 'Elm Street is slow tonight',
        visibility_radius: 200,
        status: 'ACTIVE',
        expires_at: new Date('2026-05-07T00:00:00Z'),
        created_at: new Date('2026-05-06T10:00:00Z'),
        updated_at: new Date('2026-05-06T10:00:00Z'),
        distance_m: 150,
        distance_label: 'within 150m',
        activity_score: 5,
        user: {
          user_id: 2,
          username: 'alex',
          profile_image: null,
        },
        comments_count: 2,
        reactions_count: 3,
      },
    ]);
    expect(result[0]).not.toHaveProperty('latitude');
    expect(result[0]).not.toHaveProperty('longitude');
  });

  it('should sort active feed posts by engagement before recency', async () => {
    queryBuilder.getMany.mockResolvedValue([]);

    await service.findAll({
      sort: 'active',
    });

    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      expect.stringContaining('active_comments'),
      'DESC',
    );
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
      'post.created_at',
      'DESC',
    );
  });
});
