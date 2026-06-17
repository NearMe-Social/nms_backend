import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { R2ImageStorageService } from './r2-image-storage.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { validate } from 'class-validator';

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

  it('should allow dots between username segments', async () => {
    const dto = Object.assign(new CompleteProfileDto(), {
      username: 'sophat.odom',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('should reject leading, trailing, or consecutive username dots', async () => {
    for (const username of ['.sophat', 'sophat.', 'sophat..odom']) {
      const dto = Object.assign(new CompleteProfileDto(), { username });
      await expect(validate(dto)).resolves.not.toHaveLength(0);
    }
  });

  it('should complete a skipped profile without changing its username or role', async () => {
    const user = {
      user_id: 1,
      username: 'sophat.odom',
      role: 'USER',
      profile_completed: false,
    } as User;
    usersRepository.findOne.mockResolvedValue(user);
    usersRepository.save.mockImplementation((value: User) =>
      Promise.resolve(value),
    );

    await expect(service.completeProfile(1, {})).resolves.toEqual(
      expect.objectContaining({
        username: 'sophat.odom',
        role: 'USER',
        profile_completed: true,
      }),
    );
    expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
  });

  it('should expose only public identity fields for a public profile', async () => {
    usersRepository.findOne.mockResolvedValue({
      user_id: 2,
      username: 'sokha',
      first_name: 'Sokha',
      last_name: 'Chan',
      role: 'USER',
      profile_image: null,
      bio: 'Hello nearby',
      created_at: new Date('2026-06-01T00:00:00Z'),
    });

    await expect(service.findPublicProfile(2)).resolves.not.toHaveProperty(
      'email',
    );
    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { user_id: 2, is_active: true },
      select: [
        'user_id',
        'username',
        'first_name',
        'last_name',
        'role',
        'profile_image',
        'bio',
        'created_at',
      ],
    });
  });

  it('should save editable profile fields', async () => {
    const profileUser = {
      user_id: 1,
      username: 'old.name',
      first_name: 'Old',
      last_name: 'Name',
      bio: null,
    } as User;
    usersRepository.findOne
      .mockResolvedValueOnce(profileUser)
      .mockResolvedValueOnce(null);
    usersRepository.save.mockImplementation((value: User) =>
      Promise.resolve(value),
    );

    await expect(
      service.updateProfile(1, {
        username: 'new.name',
        first_name: 'New',
        last_name: 'Neighbor',
        bio: 'Updated profile',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        username: 'new.name',
        first_name: 'New',
        last_name: 'Neighbor',
        bio: 'Updated profile',
      }),
    );
  });

  it('should clear the stored location for the current user', async () => {
    const locatedUser = {
      user_id: 1,
      current_latitude: 11.56,
      current_longitude: 104.92,
      location_updated_at: new Date(),
    } as User;
    usersRepository.findOne.mockResolvedValue(locatedUser);
    usersRepository.save.mockImplementation((value: User) =>
      Promise.resolve(value),
    );

    await expect(service.clearLocation(1)).resolves.toEqual({
      message: 'Saved location cleared successfully',
    });
    expect(locatedUser).toEqual(
      expect.objectContaining({
        current_latitude: null,
        current_longitude: null,
        location_updated_at: null,
      }),
    );
  });

  it('should return nearby users with approximate distance and no exact coordinates', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-06T10:05:00Z'));
    queryBuilder.getRawMany.mockResolvedValue([
      {
        user_id: 2,
        username: 'sokha',
        profile_image: null,
        location_updated_at: new Date('2026-05-06T10:00:00Z'),
        distance_m: '76.2',
      },
    ]);

    const result = await service.findNearby(
      {
        lat: 11.5564,
        lng: 104.9282,
        radius: 100,
      },
      1,
    );

    expect(queryBuilder.setParameters).toHaveBeenCalledWith(
      expect.objectContaining({
        lat: 11.5564,
        lng: 104.9282,
        radius: 100,
        locationFreshAfter: new Date('2026-05-06T10:00:00Z'),
      }),
    );
    expect(queryBuilder.andWhere).not.toHaveBeenCalledWith(
      'nearby_user.role = :nearbyRole',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'nearby_user.location_updated_at >= :locationFreshAfter',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('user_blocks block'),
      { currentUserId: 1 },
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
    jest.useRealTimers();
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
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('user_blocks block'),
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
