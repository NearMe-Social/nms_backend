import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { EmailVerification } from './entities/email-verification.entity';
import { EmailService } from './email.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    exists: jest.Mock;
  };
  let verificationRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };
  let emailService: { sendOtp: jest.Mock };

  const user = {
    user_id: 1,
    username: 'sokha',
    email: 'sokha@example.com',
    password_hash: 'hash',
    role: UserRole.USER,
    is_active: true,
    email_verified: false,
    profile_completed: false,
    onboarding_completed: false,
    profile_image: null,
  } as User;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      exists: jest.fn(),
    };
    verificationRepository = {
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed-token') };
    emailService = {
      sendOtp: jest.fn().mockResolvedValue(undefined),
    };

    const configValues: Record<string, string> = {
      JWT_SECRET: 'test-jwt-secret',
      MAIL_HOST: 'smtp.example.com',
      MAIL_PORT: '587',
      MAIL_USER: 'mailer',
      MAIL_PASS: 'password',
      MAIL_FROM: 'NearMe <no-reply@example.com>',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(EmailVerification),
          useValue: verificationRepository,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => configValues[key]),
          },
        },
        {
          provide: EmailService,
          useValue: emailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('registers an unverified account without issuing a JWT', async () => {
    userRepository.findOne.mockResolvedValue(null);
    userRepository.save.mockImplementation(async (value) => ({
      ...value,
      user_id: 1,
    }));

    const result = await service.register({
      username: 'sokha',
      first_name: 'Sokha',
      last_name: 'Chan',
      email: 'SOKHA@example.com',
      password: 'password123',
      birthday: undefined as any,
      gender: undefined as any,
    });

    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'sokha@example.com',
        email_verified: false,
        profile_completed: false,
        onboarding_completed: false,
      }),
    );
    expect(result).not.toHaveProperty('token');
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('stores a hashed OTP and never stores the plaintext code', async () => {
    userRepository.findOne.mockResolvedValue(user);
    verificationRepository.findOne.mockResolvedValue(null);

    await service.sendOtp('SOKHA@example.com');

    const otp = emailService.sendOtp.mock.calls[0][1] as string;
    const saved = verificationRepository.save.mock.calls[0][0];

    expect(otp).toMatch(/^\d{6}$/);
    expect(saved.email).toBe('sokha@example.com');
    expect(saved.code_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(saved.code_hash).not.toBe(otp);
    expect(saved.attempt_count).toBe(0);
  });

  it('enforces the resend cooldown', async () => {
    userRepository.findOne.mockResolvedValue(user);
    verificationRepository.findOne.mockResolvedValue({
      email: user.email,
      last_sent_at: new Date(),
    });

    await expect(service.sendOtp(user.email)).rejects.toMatchObject({
      status: 429,
    });
    expect(emailService.sendOtp).not.toHaveBeenCalled();
  });

  it('locks the OTP after five invalid attempts', async () => {
    const verification = {
      email: user.email,
      code_hash: '0'.repeat(64),
      attempt_count: 4,
      expires_at: new Date(Date.now() + 60_000),
      last_sent_at: new Date(),
      consumed_at: null,
    };
    verificationRepository.findOne.mockResolvedValue(verification);

    await expect(
      service.verifyOtp(user.email, '123456'),
    ).rejects.toBeInstanceOf(HttpException);
    expect(verification.attempt_count).toBe(5);
  });

  it('rejects expired OTPs', async () => {
    verificationRepository.findOne.mockResolvedValue({
      email: user.email,
      code_hash: '0'.repeat(64),
      attempt_count: 0,
      expires_at: new Date(Date.now() - 1),
      last_sent_at: new Date(),
      consumed_at: null,
    });

    await expect(service.verifyOtp(user.email, '123456')).rejects.toThrow(
      'OTP has expired',
    );
  });

  it('verifies once, consumes the OTP, and returns a JWT', async () => {
    userRepository.findOne.mockResolvedValue(user);
    verificationRepository.findOne.mockResolvedValue(null);
    await service.sendOtp(user.email);

    const otp = emailService.sendOtp.mock.calls[0][1] as string;
    const verification = verificationRepository.save.mock.calls[0][0];
    verificationRepository.findOne.mockResolvedValue(verification);

    const result = await service.verifyOtp(user.email, otp);

    expect(user.email_verified).toBe(true);
    expect(verification.consumed_at).toBeInstanceOf(Date);
    expect(result.token).toBe('signed-token');
    expect(result.user.email_verified).toBe(true);
  });
});
