import { Controller, UseGuards, Body, Post, Get, Request, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto, VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {GoogleAuthGuard} from './guards/google.auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(@Request() req: any) {
    return this.authService.getCurrentUser(req.user.userId);
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleAuth(){}

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
async googleAuthCallback(
  @Request() req: any,
  @Res() res: any,
) {
  const result = await this.authService.googleLogin(
    req.user,
  );

  return res.redirect(
    `http://localhost:5173/auth/google/callback?token=${result.token}`,
  );
}

  // ── NEW OTP endpoints ──
  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.email);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }
}
