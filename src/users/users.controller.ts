import {
  Controller,
  Get,
  Patch,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('nearby')
  getNearby(
    @Request() req,
    @Body() body: { lat: number; lng: number; radius?: number },
  ) {
    return this.usersService.findNearby(
      req.user.id,
      body.lat,
      body.lng,
      body.radius ?? 150,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('location')
  updateLocation(@Request() req, @Body() body: { lat: number; lng: number }) {
    return this.usersService.updateLocation(req.user.id, body.lat, body.lng);
  }
}
