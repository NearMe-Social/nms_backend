import {
  Controller,
  UseGuards,
  Get,
  Req,
  Post,
  Body,
} from '@nestjs/common';

import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {

  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyNotifications(
    @Req() req: any,
  ) {

    const userId = req.user.user_id;

    const notifications =
      await this.notificationsService.getNotificationsByUser(userId);

    return {
      success: true,
      message: 'Notifications retrieved successfully',
      data: notifications,
    };
  }

  @Post()
  async createNotification(
    @Body() body: any,
  ) {

    const notification =
      await this.notificationsService.createNotification(
        body.user_id,
        body.type,
        body.related_id,
        body.message,
      );

    return {
      success: true,
      message: 'Notification created successfully',
      data: notification,
    };
  }

}