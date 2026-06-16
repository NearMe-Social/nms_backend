import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post } from './entities/post.entities';
import { PostImage } from './entities/post-image.entity';
import { PostsService } from './posts.service';
import { R2ImageStorageService } from '../users/r2-image-storage.service';

describe('PostsService', () => {
  let service: PostsService;
  let postsRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove?: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let postImagesRepository: {
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let imageStorage: {
    uploadPostImage: jest.Mock;
    deleteByPublicUrl: jest.Mock;
  };
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
    limit: jest.Mock;
    take: jest.Mock;
    getMany: jest.Mock;
    getRawMany: jest.Mock;
  };
  let imageQueryBuilder: {
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    orderBy: jest.Mock;
    getMany: jest.Mock;
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
      limit: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getRawMany: jest.fn(),
    };
    imageQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    postsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((value: Partial<Post>) => value as Post),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    postImagesRepository = {
      create: jest.fn((value: Partial<PostImage>) => value as PostImage),
      save: jest.fn((value: PostImage[]) => Promise.resolve(value)),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue(imageQueryBuilder),
    };
    imageStorage = {
      uploadPostImage: jest.fn(),
      deleteByPublicUrl: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: postsRepository,
        },
        {
          provide: getRepositoryToken(PostImage),
          useValue: postImagesRepository,
        },
        {
          provide: R2ImageStorageService,
          useValue: imageStorage,
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
        image_url: null,
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
        image_url: null,
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
        image_urls: [],
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

  it('should search only active unexpired posts and limit results', async () => {
    queryBuilder.getMany.mockResolvedValue([]);

    await service.search('road', 11.5564, 104.9282);

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'search_post.status = :status',
      { status: 'ACTIVE' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'search_post.expires_at > NOW()',
    );
    expect(queryBuilder.limit).toHaveBeenCalledWith(5);
    expect(queryBuilder.setParameters).toHaveBeenCalledWith({
      lat: 11.5564,
      lng: 104.9282,
    });
  });

  it('should return the owner profile posts without requiring location', async () => {
    queryBuilder.getMany.mockResolvedValue([]);

    await expect(
      service.findByUserVisible(7, 7, undefined, undefined, 3),
    ).resolves.toEqual([]);

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'user.user_id = :targetUserId',
      { targetUserId: 7 },
    );
    expect(queryBuilder.take).toHaveBeenCalledWith(3);
    expect(queryBuilder.setParameters).not.toHaveBeenCalled();
  });

  it('should hide another user profile posts when viewer location is unavailable', async () => {
    await expect(service.findByUserVisible(8, 7)).resolves.toEqual([]);
    expect(queryBuilder.getMany).not.toHaveBeenCalled();
  });

  it('should filter another user profile posts by each post visibility radius', async () => {
    queryBuilder.getMany.mockResolvedValue([]);

    await service.findByUserVisible(8, 7, 11.5564, 104.9282);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('profile_post.visibility_radius'),
    );
    expect(queryBuilder.setParameters).toHaveBeenCalledWith({
      lat: 11.5564,
      lng: 104.9282,
    });
  });

  it('should hide a post from a non-owner outside its visibility radius', async () => {
    postsRepository.findOne.mockResolvedValue({
      post_id: 4,
      latitude: 11.5564,
      longitude: 104.9282,
      visibility_radius: 200,
      status: 'ACTIVE',
      expires_at: new Date(Date.now() + 60_000),
      user: { user_id: 8 },
    });

    await expect(service.findVisibleOne(4, 7, 11.57, 104.94)).rejects.toThrow(
      'Post is not available at your location',
    );
  });

  it('should let the owner access their post outside its visibility radius', async () => {
    postsRepository.findOne.mockResolvedValue({
      post_id: 4,
      title: 'My post',
      latitude: 11.5564,
      longitude: 104.9282,
      visibility_radius: 200,
      status: 'ACTIVE',
      expires_at: new Date(Date.now() + 60_000),
      user: { user_id: 7 },
    });

    await expect(service.findVisibleOne(4, 7)).resolves.toEqual(
      expect.objectContaining({ post_id: 4, title: 'My post' }),
    );
  });

  it('should upload an optional image and save its URL with the post', async () => {
    const file = {
      mimetype: 'image/jpeg',
      buffer: Buffer.from('image'),
    } as Express.Multer.File;
    imageStorage.uploadPostImage.mockResolvedValue({
      key: 'post-images/7/post.jpg',
      url: 'https://images.example.com/post-images/7/post.jpg',
    });
    postsRepository.save.mockImplementation((value: Post) =>
      Promise.resolve(value),
    );

    await expect(
      service.create(
        {
          title: 'Local update',
          content: 'A useful neighborhood update',
          latitude: 11.5564,
          longitude: 104.9282,
          visibility_radius: 100,
          expires_at: '2026-06-11T10:00:00.000Z',
        },
        7,
        [file],
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        image_url: 'https://images.example.com/post-images/7/post.jpg',
        image_urls: ['https://images.example.com/post-images/7/post.jpg'],
        user: { user_id: 7 },
      }),
    );
    expect(postImagesRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({
        image_url: 'https://images.example.com/post-images/7/post.jpg',
        display_order: 0,
      }),
    ]);
  });

  it('should replace a post image when the owner updates with a new image', async () => {
    const file = {
      mimetype: 'image/png',
      buffer: Buffer.from('image'),
    } as Express.Multer.File;
    const existingPost = {
      post_id: 9,
      title: 'Old title',
      content: 'Old content',
      image_url: 'https://images.example.com/post-images/7/old.png',
      images: [],
      visibility_radius: 100,
      expires_at: new Date(Date.now() + 60_000),
      user: { user_id: 7 },
    } as Post;

    postsRepository.findOne.mockResolvedValue(existingPost);
    imageStorage.uploadPostImage.mockResolvedValue({
      key: 'post-images/7/new.png',
      url: 'https://images.example.com/post-images/7/new.png',
    });
    postsRepository.save.mockImplementation((value: Post) =>
      Promise.resolve(value),
    );

    await expect(
      service.update(
        9,
        {
          title: 'New title',
          content: 'New content',
          visibility_radius: 200,
          expires_at: new Date(Date.now() + 120_000).toISOString(),
        },
        7,
        [file],
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        title: 'New title',
        content: 'New content',
        image_url: 'https://images.example.com/post-images/7/new.png',
        image_urls: ['https://images.example.com/post-images/7/new.png'],
        visibility_radius: 200,
      }),
    );

    expect(imageStorage.deleteByPublicUrl).toHaveBeenCalledWith(
      'https://images.example.com/post-images/7/old.png',
      'post-images',
    );
  });
});
