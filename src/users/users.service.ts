import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findNearby(
    requesterId: string,
    lat: number,
    lng: number,
    radiusMeters = 150,
  ) {
    const rows: Array<{
      id: string;
      username: string;
      distance_meters: number;
    }> = await this.userRepo.query(
      `
        SELECT id, username,
          ROUND(
            6371000 * acos(
              LEAST(1.0,
                cos(radians($2)) * cos(radians(current_latitude::float)) *
                cos(radians(current_longitude::float) - radians($3)) +
                sin(radians($2)) * sin(radians(current_latitude::float))
              )
            )
          ) AS distance_meters
        FROM users
        WHERE is_active = true
          AND id != $1
          AND current_latitude IS NOT NULL
          AND current_longitude IS NOT NULL
        ORDER BY distance_meters ASC
        LIMIT 50
        `,
      [requesterId, lat, lng],
    );

    // Filter by radius and snap distance to nearest 25m for privacy
    return rows
      .filter((u) => u.distance_meters <= radiusMeters)
      .map((u) => ({
        id: u.id,
        username: u.username,
        approximate_distance_m: Math.round(u.distance_meters / 25) * 25,
      }));
  }

  async updateLocation(userId: string, lat: number, lng: number) {
    await this.userRepo.update(userId, {
      current_latitude: lat,
      current_longitude: lng,
    });
  }
}
