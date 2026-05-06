import {
  Controller,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  ClassSerializerInterceptor,
  UseInterceptors,
  Patch,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NearbyUsersQueryDto } from './dto/nearby-users-query.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Request } from 'express';
//import { JwtAuthGuard } from '../auth/guards/jwt.guard';

interface RequestWithUser extends Request {
  user: { userId: number };
}
// @UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMyProfile(@Req() req: RequestWithUser) {
    return this.usersService.findById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('nearby')
  async findNearby(
    @Query() query: NearbyUsersQueryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.usersService.findNearby(query, req.user.userId);
  }

  @Get(':id')
  async getProfile(@Param('id') id: number) {
    return this.usersService.findById(id);
  }

  @Patch('me')
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/location')
  async updateMyLocation(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.usersService.updateLocation(req.user.userId, dto);
  }
}
