import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findById(user_id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { user_id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User> {
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
}
