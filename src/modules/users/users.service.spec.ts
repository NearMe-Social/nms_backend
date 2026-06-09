import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let queryBuilder: {
    select: jest.Mock;
    addSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    setParameters: jest.Mock;
    orderBy: jest.Mock;
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
      getRawMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
          },
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
});
