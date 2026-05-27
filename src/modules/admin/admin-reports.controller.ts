import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminReportsService } from './admin-reports.service';
import { AdminReportQueryDto } from './dto/admin-report-query.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminReportsController {
  constructor(private readonly adminReportsService: AdminReportsService) {}

  @Get()
  getReportList(@Query() query: AdminReportQueryDto) {
    return this.adminReportsService.getReportList(query);
  }

  @Get(':reportId')
  getReportDetail(@Param('reportId', ParseIntPipe) reportId: number) {
    return this.adminReportsService.getReportDetail(reportId);
  }

  @Patch(':reportId/status')
  updateReportStatus(
    @Param('reportId', ParseIntPipe) reportId: number,
    @Body() dto: UpdateReportStatusDto,
    @Req() req: any,
  ) {
    return this.adminReportsService.updateReportStatus(
      reportId,
      req.user.userId,
      dto,
    );
  }
}
