import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsQueryDto } from './dto/notifications-query.dto';
import { Notification } from './entities/notification.entities';

@Injectable()
export class NotificationsService {
	constructor(
		@InjectRepository(Notification)
		private readonly notificationRepo: Repository<Notification>,
	) {}

	async createNotification(
		dto: CreateNotificationDto,
	): Promise<Notification> {
		const notification = this.notificationRepo.create({
			user: { user_id: dto.user_id },
			type: dto.type,
			related_id: dto.related_id,
			message: dto.message,
		});

		return this.notificationRepo.save(notification);
	}

	async getNotificationsByUser(
		userId: number,
		query: NotificationsQueryDto = new NotificationsQueryDto(),
	): Promise<{ total: number; data: NotificationListItem[] }> {
		const page = query.page ?? 0;
		const size = query.size ?? 20;

		const [items, total] = await this.notificationRepo.findAndCount({
			where: { user: { user_id: userId } },
			order: { created_at: 'DESC' },
			skip: page * size,
			take: size,
		});

		return {
			total,
			data: items.map((notification) => ({
				notification_id: notification.notification_id,
				type: notification.type,
				related_id: notification.related_id,
				message: notification.message,
				is_read: notification.is_read,
				created_at: notification.created_at,
			})),
		};
	}

	async markAsRead(
		userId: number,
		notificationId: number,
	): Promise<Notification> {
		const notification = await this.notificationRepo.findOne({
			where: { notification_id: notificationId, user: { user_id: userId } },
		});

		if (!notification) {
			throw new NotFoundException('Notification not found');
		}

		if (!notification.is_read) {
			notification.is_read = true;
		}

		return this.notificationRepo.save(notification);
	}
}

export interface NotificationListItem {
	notification_id: number;
	type: Notification['type'];
	related_id: number;
	message: string;
	is_read: boolean;
	created_at: Date;
}
