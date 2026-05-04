import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, Gender } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existing = await this.userRepository.findOne({
      where: [{ email: registerDto.email }, { username: registerDto.username }],
    });

    if (existing) {
        throw new BadRequestException('Email or username already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      username: registerDto.username,
      email: registerDto.email,
      first_name: registerDto.first_name,
      last_name: registerDto.last_name,
      password_hash: passwordHash,
      birthday: registerDto.birthday ? new Date(registerDto.birthday) : (null as any),
      gender: registerDto.gender ? (registerDto.gender as Gender) : (null as any),
      role: UserRole.USER,
      is_active: true,
    });

    const savedUser = await this.userRepository.save(user);

    const payload = {
      sub: savedUser.user_id,
      email: savedUser.email,
      role: savedUser.role,
    };

    return {
      message: 'Registration successful',
      token: this.jwtService.sign(payload),
      user: {
        user_id: savedUser.user_id,
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: {email: loginDto.email},
    });

    if(!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatched = await bcrypt.compare(loginDto.password, user.password_hash);

    if(!passwordMatched) {
      throw new UnauthorizedException('Invalid password');
    }

    if(!user.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }

    const payload = {
      sub: user.user_id,
      email: user.email,
      role: user.role,
    };

    return {
      message: 'Login successful',
      token: this.jwtService.sign(payload),
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getCurrentUser(userId: number) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      select: ['user_id', 'username', 'email', 'role', 'is_active'],
    });

    if(!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
