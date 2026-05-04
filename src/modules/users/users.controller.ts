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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
// import { Request } from 'express';
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
}
