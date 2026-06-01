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
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarkNotificationReadDto } from './dto/mark-notification-read.dto';
import { NotificationsQueryDto } from './dto/notifications-query.dto';
import { NotificationsService } from './notifications.service';

interface RequestWithUser extends Request {
	user: { userId: number };
}

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
	constructor(private readonly notificationsService: NotificationsService) {}

	@Get()
	getMyNotifications(
		@Req() req: RequestWithUser,
		@Query() query: NotificationsQueryDto,
	) {
		return this.notificationsService.getNotificationsByUser(
			req.user.userId,
			query,
		);
	}

	@Patch(':notificationId/read')
	markRead(
		@Req() req: RequestWithUser,
		@Param('notificationId', ParseIntPipe) notificationId: number,
		@Body() _dto: MarkNotificationReadDto,
	) {
		return this.notificationsService.markAsRead(
			req.user.userId,
			notificationId,
		);
	}
}
