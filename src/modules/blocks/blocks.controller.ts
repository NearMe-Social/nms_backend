import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CreateBlockDto } from './dto/create-block.dto';
import { UserBlock } from './entities/user-block.entity';
import { BlocksService } from './blocks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: { userId: number };
}

@UseGuards(JwtAuthGuard)
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get('me')
  getMyBlockedUsers(@Req() req: RequestWithUser) {
    return this.blocksService.getBlockedUsers(req.user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  block(
    @Req() req: RequestWithUser,
    @Body() createBlockDto: CreateBlockDto,
  ): Promise<UserBlock> {
    return this.blocksService.block(
      req.user.userId,
      createBlockDto.blocked_user_id,
    );
  }

  @Delete('me/:blockedUserId')
  @HttpCode(HttpStatus.OK)
  unblock(
    @Req() req: RequestWithUser,
    @Param('blockedUserId', ParseIntPipe) blockedUserId: number,
  ): Promise<{ message: string }> {
    return this.blocksService.unblock(req.user.userId, blockedUserId);
  }
}
