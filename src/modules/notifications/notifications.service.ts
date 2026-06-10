import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsQueryDto } from './dto/notifications-query.dto';
import {
  Notification,
  NotificationType,
} from './entities/notification.entities';
import { Comment } from '../comments/entities/comment.entities';
import { Message } from '../messages/entities/message.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
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
    const commentIds = items
      .filter((item) => item.type === NotificationType.COMMENT)
      .map((item) => item.related_id);
    const messageIds = items
      .filter((item) => item.type === NotificationType.MESSAGE)
      .map((item) => item.related_id);
    const commentsPromise: Promise<Comment[]> = commentIds.length
      ? this.commentRepo.find({
          where: { comment_id: In(commentIds) },
          relations: ['post'],
        })
      : Promise.resolve([]);
    const messagesPromise: Promise<Message[]> = messageIds.length
      ? this.messageRepo.find({
          where: { message_id: In(messageIds) },
        })
      : Promise.resolve([]);
    const [comments, messages]: [Comment[], Message[]] = await Promise.all([
      commentsPromise,
      messagesPromise,
    ]);
    const commentTargets = new Map<number, string>();
    for (const comment of comments) {
      const post = comment.post as { post_id?: number };
      if (!post.post_id) continue;
      commentTargets.set(
        comment.comment_id,
        `/posts/${post.post_id}?commentId=${comment.comment_id}`,
      );
    }
    const messageTargets = new Map<number, string>();
    for (const message of messages) {
      messageTargets.set(
        message.message_id,
        `/chat?conversationId=${message.conversation_id}&messageId=${message.message_id}`,
      );
    }

    return {
      total,
      data: items.map((notification) => ({
        notification_id: notification.notification_id,
        type: notification.type,
        related_id: notification.related_id,
        message: notification.message,
        is_read: notification.is_read,
        created_at: notification.created_at,
        target_path:
          notification.type === NotificationType.COMMENT
            ? (commentTargets.get(notification.related_id) ?? null)
            : notification.type === NotificationType.MESSAGE
              ? (messageTargets.get(notification.related_id) ?? null)
              : null,
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
  target_path: string | null;
}
