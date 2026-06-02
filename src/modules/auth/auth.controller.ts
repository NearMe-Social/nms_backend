import { Controller, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Body, Post } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Get, Request } from '@nestjs/common';
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
  getCurrentuser(@Request() req:any) {
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

}
