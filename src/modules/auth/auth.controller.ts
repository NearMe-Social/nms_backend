import { Controller, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Body, Post } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Get, Request } from '@nestjs/common';

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
}
