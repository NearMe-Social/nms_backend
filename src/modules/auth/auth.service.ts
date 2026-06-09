import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, Gender } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { exhaustMap } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  // Store OTPs in memory: { email: { otp, expiresAt } }
  private otpStore = new Map<string, { otp: string; expiresAt: Date }>();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── existing register ──
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

  // ── existing login ──
  async login(loginDto: LoginDto) {
  const user = await this.userRepository.findOne({
    where: { email: loginDto.email },
  });

  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  
  if (!user.password_hash) {
    throw new UnauthorizedException(
      'This account uses Google login. Please sign in with Google.',
    );
  }

  const passwordMatched = await bcrypt.compare(
    loginDto.password,
    user.password_hash,
  );

  if (!passwordMatched) {
    throw new UnauthorizedException('Invalid password');
  }

  if (!user.is_active) {
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

  async googleLogin(googleUser: any) {
  let user = await this.userRepository.findOne({
    where: {
      email: googleUser.email,
    },
  });

  if (!user) {
    user = this.userRepository.create({
      username: googleUser.email.split('@')[0],
      email: googleUser.email,
      first_name: googleUser.first_name || '',
      last_name: googleUser.last_name || '',
      password_hash: 'GOOGLE_AUTH_USER',
      profile_image: googleUser.profile_image,
      role: UserRole.USER,
      is_active: true,
    });

    user = await this.userRepository.save(user);
  }

  const payload = {
    sub: user.user_id,
    email: user.email,
    role: user.role,
  };

  return {
    message: 'Google login successful',
    token: this.jwtService.sign(payload),
    user: {
      user_id: user.user_id,
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
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  // ── NEW: send OTP ──
  async sendOtp(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Email not found');

    // generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // store OTP
    this.otpStore.set(email, { otp, expiresAt });

    // send email
    const transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });

    await transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: 'Your NearMe Social OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
          <h2 style="color: #0c9081;">NearMe Social</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing: 8px; color: #1a1a2e; font-size: 36px;">${otp}</h1>
          <p style="color: #666;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    return { message: 'OTP sent successfully' };
  }

  // ── NEW: verify OTP ──
  async verifyOtp(email: string, otp: string) {
    const stored = this.otpStore.get(email);

    if (!stored) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    if (new Date() > stored.expiresAt) {
      this.otpStore.delete(email);
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    if (stored.otp !== otp) {
      throw new BadRequestException('Invalid OTP. Please try again.');
    }

    // OTP is correct — delete it
    this.otpStore.delete(email);

    // get user and return token
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new BadRequestException('User not found');

    const payload = {
      sub: user.user_id,
      email: user.email,
      role: user.role,
    };

    return {
      message: 'OTP verified successfully',
      token: this.jwtService.sign(payload),
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }
}
