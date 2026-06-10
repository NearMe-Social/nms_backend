import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { R2ImageStorageService } from './r2-image-storage.service';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let profileImageStorage: {
    uploadProfileImage: jest.Mock;
    deleteByPublicUrl: jest.Mock;
  };
  let queryBuilder: {
    select: jest.Mock;
    addSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    setParameters: jest.Mock;
    orderBy: jest.Mock;
    limit: jest.Mock;
    getRawMany: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };
    usersRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    profileImageStorage = {
      uploadProfileImage: jest.fn(),
      deleteByPublicUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: R2ImageStorageService,
          useValue: profileImageStorage,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return nearby users with approximate distance and no exact coordinates', async () => {
    queryBuilder.getRawMany.mockResolvedValue([
      {
        user_id: 2,
        username: 'sokha',
        profile_image: null,
        location_updated_at: new Date('2026-05-06T10:00:00Z'),
        distance_m: '76.2',
      },
    ]);

    const result = await service.findNearby({
      lat: 11.5564,
      lng: 104.9282,
      radius: 100,
    });

    expect(queryBuilder.setParameters).toHaveBeenCalledWith(
      expect.objectContaining({
        lat: 11.5564,
        lng: 104.9282,
        radius: 100,
        nearbyRole: 'USER',
        locationFreshAfter: expect.any(Date),
      }),
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'nearby_user.role = :nearbyRole',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'nearby_user.location_updated_at >= :locationFreshAfter',
    );
    expect(result).toEqual([
      {
        id: '2',
        username: 'sokha',
        profile_image: null,
        location_updated_at: new Date('2026-05-06T10:00:00Z'),
        distance_m: 100,
        distance_label: 'within 100m',
      },
    ]);
    expect(result[0]).not.toHaveProperty('current_latitude');
    expect(result[0]).not.toHaveProperty('current_longitude');
  });

  it('should search active non-admin users without exposing private fields', async () => {
    queryBuilder.getRawMany.mockResolvedValue([
      {
        user_id: 2,
        username: 'sokha',
        first_name: 'Sokha',
        last_name: 'Chan',
        profile_image: null,
      },
    ]);

    await expect(service.search('sok', 1)).resolves.toHaveLength(1);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'search_user.role = :role',
      { role: 'USER' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'search_user.user_id != :currentUserId',
      { currentUserId: 1 },
    );
    expect(queryBuilder.limit).toHaveBeenCalledWith(5);
  });

  it('should persist an uploaded profile image and remove the previous R2 object', async () => {
    const user = {
      user_id: 1,
      profile_image: 'https://images.example.com/profile-images/1/old.jpg',
    } as User;
    const file = {
      mimetype: 'image/png',
      buffer: Buffer.from('image'),
    } as Express.Multer.File;

    usersRepository.findOne.mockResolvedValue(user);
    profileImageStorage.uploadProfileImage.mockResolvedValue({
      key: 'profile-images/1/new.png',
      url: 'https://images.example.com/profile-images/1/new.png',
    });
    usersRepository.save.mockImplementation((value: User) =>
      Promise.resolve(value),
    );

    await expect(service.updateProfileImage(1, file)).resolves.toEqual({
      url: 'https://images.example.com/profile-images/1/new.png',
      user: expect.objectContaining({
        profile_image: 'https://images.example.com/profile-images/1/new.png',
      }),
    });
    expect(profileImageStorage.deleteByPublicUrl).toHaveBeenCalledWith(
      'https://images.example.com/profile-images/1/old.jpg',
      'profile-images',
    );
  });
});
