import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminPermissionsService } from './admin-permissions.service';

@Controller('admin/permissions')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminPermissionsController {
  constructor(private readonly adminPermissionsService: AdminPermissionsService) {}

  @Get()
  getPermissions() {
    return this.adminPermissionsService.getPermissions();
  }
}
