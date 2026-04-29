import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
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
      passwordHash,
      role: 'USER',
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    const payload = {
      sub: savedUser.userId,
      email: savedUser.email,
      role: savedUser.role,
    };

    return {
      message: 'Registration successful',
      token: this.jwtService.sign(payload),
      user: {
        userId: savedUser.userId,
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

    const passwordMatched = await bcrypt.compare(loginDto.password, user.passwordHash);

    if(!passwordMatched) {
      throw new UnauthorizedException('Invalid password');
    }

    if(!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const payload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
    };

    return {
      message: 'Login successful',
      token: this.jwtService.sign(payload),
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getCurrentUser(userId: number) {
    const user = await this.userRepository.findOne({
      where: { userId },
      select: ['userId', 'username', 'email', 'role', 'isActive'],
    });

    if(!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
