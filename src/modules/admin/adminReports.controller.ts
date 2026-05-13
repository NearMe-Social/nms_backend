import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminService } from './adminReports.service';
import { AdminReportQueryDto } from './dto/adminReports.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('reports')
  getReportList(@Query() query: AdminReportQueryDto) {
    return this.adminService.getReportList(query);
  }
}