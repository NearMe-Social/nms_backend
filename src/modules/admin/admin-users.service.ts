import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getUserList() {
    const users = await this.userRepo.find({
      order: { created_at: 'DESC' },
    });

    return users.map((user) => this.toAdminUserResponse(user));
  }

  async updateUserStatus(
    userId: number,
    adminUserId: number | null,
    isActive: boolean,
  ) {
    if (adminUserId === userId && !isActive) {
      throw new BadRequestException('Admins cannot suspend their own account');
    }

    const user = await this.userRepo.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.is_active = isActive;
    user.updated_at = new Date();

    const savedUser = await this.userRepo.save(user);

    return this.toAdminUserResponse(savedUser);
  }

  private toAdminUserResponse(user: User) {
    return {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isActive: user.is_active,
      profileImage: user.profile_image,
      bio: user.bio,
      locationUpdatedAt: user.location_updated_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }
}
