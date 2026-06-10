import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, Gender } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GoogleUser } from './strategies/google.strategy';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { EmailVerification } from './entities/email-verification.entity';
import { EmailService } from './email.service';

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(EmailVerification)
    private readonly emailVerificationRepository: Repository<EmailVerification>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  // ── existing register ──
  async register(registerDto: RegisterDto) {
    const email = registerDto.email.trim().toLowerCase();
    const existing = await this.userRepository.findOne({
      where: [{ email }, { username: registerDto.username }],
    });
    if (existing) {
      throw new BadRequestException('Email or username already exists');
    }
    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const user = this.userRepository.create({
      username: registerDto.username,
      email,
      first_name: registerDto.first_name,
      last_name: registerDto.last_name,
      password_hash: passwordHash,
      birthday: registerDto.birthday
        ? new Date(registerDto.birthday)
        : (null as any),
      gender: registerDto.gender
        ? (registerDto.gender as Gender)
        : (null as any),
      role: UserRole.USER,
      is_active: true,
      email_verified: false,
      profile_completed: false,
      onboarding_completed: false,
    });
    const savedUser = await this.userRepository.save(user);

    return {
      message: 'Registration successful. Verify your email to continue.',
      email: savedUser.email,
    };
  }

  // ── existing login ──
  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email },
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

    if (!user.email_verified) {
      throw new UnauthorizedException(
        'Please verify your email before signing in.',
      );
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
        email_verified: user.email_verified,
        profile_completed: user.profile_completed,
        onboarding_completed: user.onboarding_completed,
        profile_image: user.profile_image,
      },
    };
  }

  async googleLogin(googleUser: GoogleUser) {
    let user = await this.userRepository.findOne({
      where: [{ google_id: googleUser.googleId }, { email: googleUser.email }],
    });

    if (!user) {
      const usernameBase = googleUser.email
        .split('@')[0]
        .replace(/[^a-zA-Z0-9_]/g, '');

      let username = usernameBase;
      let suffix = 1;

      while (await this.userRepository.exists({ where: { username } })) {
        username = `${usernameBase}${suffix++}`;
      }

      user = this.userRepository.create({
        google_id: googleUser.googleId,
        username,
        email: googleUser.email,
        first_name: googleUser.firstName,
        last_name: googleUser.lastName,
        profile_image: googleUser.profileImage,
        password_hash: null,
        role: UserRole.USER,
        is_active: true,
        email_verified: true,
        profile_completed: false,
        onboarding_completed: false,
      });
    } else if (!user.google_id) {
      user.google_id = googleUser.googleId;
    }

    user.email_verified = true;

    if (!user.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }

    user = await this.userRepository.save(user);

    const token = this.jwtService.sign({
      sub: user.user_id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified,
        profile_completed: user.profile_completed,
        onboarding_completed: user.onboarding_completed,
        profile_image: user.profile_image,
      },
    };
  }

  async getCurrentUser(userId: number) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      select: [
        'user_id',
        'username',
        'email',
        'role',
        'is_active',
        'email_verified',
        'profile_completed',
        'onboarding_completed',
        'profile_image',
      ],
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async sendOtp(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const genericResponse = {
      message: 'If the account requires verification, a code has been sent.',
    };
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user || user.email_verified) {
      return genericResponse;
    }

    const now = new Date();
    let verification = await this.emailVerificationRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (
      verification &&
      now.getTime() - verification.last_sent_at.getTime() <
        OTP_RESEND_COOLDOWN_MS
    ) {
      const retryAfterSeconds = Math.ceil(
        (OTP_RESEND_COOLDOWN_MS -
          (now.getTime() - verification.last_sent_at.getTime())) /
          1000,
      );

      throw new HttpException(
        {
          message: `Please wait ${retryAfterSeconds} seconds before requesting another code.`,
          retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const otp = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);

    await this.emailService.sendOtp(normalizedEmail, otp);

    const values = {
      email: normalizedEmail,
      code_hash: this.hashOtp(normalizedEmail, otp),
      attempt_count: 0,
      expires_at: expiresAt,
      last_sent_at: now,
      consumed_at: null,
    };

    if (verification) {
      Object.assign(verification, values);
    } else {
      verification = this.emailVerificationRepository.create(values);
    }

    await this.emailVerificationRepository.save(verification);
    return genericResponse;
  }

  async verifyOtp(email: string, otp: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const verification = await this.emailVerificationRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!verification || verification.consumed_at) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    if (new Date() > verification.expires_at) {
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    if (verification.attempt_count >= OTP_MAX_ATTEMPTS) {
      throw new HttpException(
        'Too many attempts. Request a new code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!this.otpMatches(normalizedEmail, otp, verification.code_hash)) {
      verification.attempt_count += 1;
      await this.emailVerificationRepository.save(verification);

      if (verification.attempt_count >= OTP_MAX_ATTEMPTS) {
        throw new HttpException(
          'Too many attempts. Request a new code.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new BadRequestException('Invalid OTP. Please try again.');
    }

    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (!user) throw new BadRequestException('User not found');
    if (!user.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }

    user.email_verified = true;
    verification.consumed_at = new Date();
    await this.userRepository.save(user);
    await this.emailVerificationRepository.save(verification);

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
        email_verified: user.email_verified,
        profile_completed: user.profile_completed,
        onboarding_completed: user.onboarding_completed,
        profile_image: user.profile_image,
      },
    };
  }

  private hashOtp(email: string, otp: string): string {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    return createHmac('sha256', secret)
      .update(`email-verification:${email}:${otp}`)
      .digest('hex');
  }

  private otpMatches(
    email: string,
    otp: string,
    expectedHash: string,
  ): boolean {
    const actual = Buffer.from(this.hashOtp(email, otp), 'hex');
    const expected = Buffer.from(expectedHash, 'hex');

    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }
}
