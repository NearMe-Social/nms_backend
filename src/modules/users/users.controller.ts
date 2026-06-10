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
  Post,
  UploadedFile,
  ParseFilePipeBuilder,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NearbyUsersQueryDto } from './dto/nearby-users-query.dto';
import { SearchUsersQueryDto } from './dto/search-users-query.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
//import { JwtAuthGuard } from '../auth/guards/jwt.guard';

interface RequestWithUser extends Request {
  user: { userId: number };
}
// @UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Req() req: RequestWithUser) {
    return this.usersService.findById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async search(
    @Query() query: SearchUsersQueryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.usersService.search(query.q, req.user.userId);
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

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/profile-image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadProfileImage(
    @Req() req: RequestWithUser,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
        .addFileTypeValidator({
          fileType: /image\/(jpeg|png|webp)/,
        })
        .build({
          fileIsRequired: true,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.usersService.updateProfileImage(req.user.userId, file);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/complete-profile')
  async completeProfile(
    @Req() req: RequestWithUser,
    @Body() dto: CompleteProfileDto,
  ) {
    return this.usersService.completeProfile(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/complete-onboarding')
  async completeOnboarding(@Req() req: RequestWithUser) {
    return this.usersService.completeOnboarding(req.user.userId);
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
