import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminUsersService } from './admin-users.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  getUserList() {
    return this.adminUsersService.getUserList();
  }

  @Patch(':userId/status')
  updateUserStatus(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: any,
  ) {
    return this.adminUsersService.updateUserStatus(
      userId,
      req.user.userId,
      dto.isActive,
    );
  }

  @Patch(':userId/suspend')
  suspendUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: any,
  ) {
    return this.adminUsersService.updateUserStatus(
      userId,
      req.user.userId,
      false,
    );
  }

  @Patch(':userId/activate')
  activateUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.adminUsersService.updateUserStatus(userId, null, true);
  }
}
