import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminContentService } from './admin-content.service';
import {
  AdminContentAction,
  AdminContentTargetType,
} from './dto/content-action.dto';

@Controller('admin/content')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminContentController {
  constructor(private readonly adminContentService: AdminContentService) {}

  @Get('flagged')
  getFlaggedContent() {
    return this.adminContentService.getFlaggedContent();
  }

  @Patch(':targetType/:targetId/:action')
  updateContentStatus(
    @Param('targetType') targetType: AdminContentTargetType,
    @Param('targetId', ParseIntPipe) targetId: number,
    @Param('action') action: AdminContentAction,
  ) {
    return this.adminContentService.updateContentStatus(
      targetType,
      targetId,
      action,
    );
  }
}
