import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { NearbyUsersQueryDto } from './dto/nearby-users-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { R2ImageStorageService } from './r2-image-storage.service';

const NEARBY_LOCATION_MAX_AGE_MS = 2 * 60 * 1000;

export interface NearbyUserResponse {
  id: string;
  username: string;
  distance_m: number;
  distance_label: string;
  profile_image?: string | null;
  location_updated_at: Date | null;
}

export interface UserSearchResponse {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_image: string | null;
}

interface NearbyUserRaw {
  user_id: number | string;
  username: string;
  profile_image: string | null;
  location_updated_at: Date | null;
  distance_m: number | string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly imageStorage: R2ImageStorageService,
  ) {}

  async findById(user_id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { user_id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async updateProfile(user_id: number, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(user_id);

    if (dto.username !== undefined) user.username = dto.username;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.profile_image !== undefined) user.profile_image = dto.profile_image;

    return this.usersRepository.save(user);
  }

  async updateProfileImage(
    user_id: number,
    file: Express.Multer.File,
  ): Promise<{ url: string; user: User }> {
    const user = await this.findById(user_id);
    const previousImage = user.profile_image;
    const uploaded = await this.imageStorage.uploadProfileImage(user_id, file);

    try {
      user.profile_image = uploaded.url;
      const savedUser = await this.usersRepository.save(user);

      try {
        await this.imageStorage.deleteByPublicUrl(
          previousImage,
          'profile-images',
        );
      } catch {
        // Replacing the current image should still succeed if old-object cleanup fails.
      }

      return {
        url: uploaded.url,
        user: savedUser,
      };
    } catch (error) {
      try {
        await this.imageStorage.deleteByPublicUrl(
          uploaded.url,
          'profile-images',
        );
      } catch {
        // Preserve the database error if compensating storage cleanup also fails.
      }
      throw error;
    }
  }

  async completeProfile(
    user_id: number,
    dto: CompleteProfileDto,
  ): Promise<User> {
    const user = await this.findById(user_id);

    if (dto.username && dto.username !== user.username) {
      const existing = await this.usersRepository.findOne({
        where: { username: dto.username },
      });

      if (existing) {
        throw new ConflictException('Username is already taken');
      }

      user.username = dto.username;
    }

    user.profile_completed = true;
    return this.usersRepository.save(user);
  }

  async completeOnboarding(user_id: number): Promise<User> {
    const user = await this.findById(user_id);
    user.profile_completed = true;
    user.onboarding_completed = true;
    return this.usersRepository.save(user);
  }

  async search(
    query: string,
    currentUserId: number,
  ): Promise<UserSearchResponse[]> {
    const search = `%${this.escapeLikePattern(query)}%`;

    return this.usersRepository
      .createQueryBuilder('search_user')
      .select('search_user.user_id', 'user_id')
      .addSelect('search_user.username', 'username')
      .addSelect('search_user.first_name', 'first_name')
      .addSelect('search_user.last_name', 'last_name')
      .addSelect('search_user.profile_image', 'profile_image')
      .where('search_user.is_active = true')
      .andWhere('search_user.role = :role', { role: UserRole.USER })
      .andWhere('search_user.user_id != :currentUserId', { currentUserId })
      .andWhere(
        `(
          search_user.username ILIKE :search ESCAPE '\\' OR
          search_user.first_name ILIKE :search ESCAPE '\\' OR
          search_user.last_name ILIKE :search ESCAPE '\\'
        )`,
        { search },
      )
      .orderBy('search_user.username', 'ASC')
      .limit(5)
      .getRawMany<UserSearchResponse>();
  }

  async updateLocation(
    user_id: number,
    dto: UpdateLocationDto,
  ): Promise<{ message: string }> {
    const user = await this.findById(user_id);
    user.current_latitude = dto.lat;
    user.current_longitude = dto.lng;
    user.location_updated_at = new Date();

    await this.usersRepository.save(user);
    return { message: 'Location updated successfully' };
  }

  async findNearby(
    query: NearbyUsersQueryDto,
    currentUserId?: number,
  ): Promise<NearbyUserResponse[]> {
    const radius = query.radius ?? 200;
    const locationFreshAfter = new Date(
      Date.now() - NEARBY_LOCATION_MAX_AGE_MS,
    );
    const distanceSql = `
      6371000 * 2 * asin(
        sqrt(
          power(sin(radians((nearby_user.current_latitude::float - :lat) / 2)), 2) +
          cos(radians(:lat)) *
          cos(radians(nearby_user.current_latitude::float)) *
          power(sin(radians((nearby_user.current_longitude::float - :lng) / 2)), 2)
        )
      )
    `;

    const queryBuilder = this.usersRepository
      .createQueryBuilder('nearby_user')
      .select('nearby_user.user_id', 'user_id')
      .addSelect('nearby_user.username', 'username')
      .addSelect('nearby_user.profile_image', 'profile_image')
      .addSelect('nearby_user.location_updated_at', 'location_updated_at')
      .addSelect(distanceSql, 'distance_m')
      .where('nearby_user.is_active = true')
      .andWhere('nearby_user.role = :nearbyRole')
      .andWhere('nearby_user.current_latitude IS NOT NULL')
      .andWhere('nearby_user.current_longitude IS NOT NULL')
      .andWhere('nearby_user.location_updated_at >= :locationFreshAfter')
      .andWhere(`${distanceSql} <= :radius`)
      .setParameters({
        lat: query.lat,
        lng: query.lng,
        radius,
        nearbyRole: UserRole.USER,
        locationFreshAfter,
      })
      .orderBy('distance_m', 'ASC');

    if (currentUserId) {
      queryBuilder.andWhere('nearby_user.user_id != :currentUserId', {
        currentUserId,
      });
    }

    const rows = await queryBuilder.getRawMany<NearbyUserRaw>();

    return rows.map((row) => {
      const distance = this.approximateDistanceMeters(Number(row.distance_m));

      return {
        id: String(row.user_id),
        username: row.username,
        profile_image: row.profile_image,
        location_updated_at: row.location_updated_at,
        distance_m: distance,
        distance_label: this.distanceLabel(distance),
      };
    });
  }

  private approximateDistanceMeters(distance: number): number {
    if (distance <= 50) {
      return 50;
    }

    return Math.ceil(distance / 50) * 50;
  }

  private distanceLabel(distance: number): string {
    return `within ${distance}m`;
  }

  private escapeLikePattern(value: string): string {
    return value.replace(/[\\%_]/g, '\\$&');
  }
}
