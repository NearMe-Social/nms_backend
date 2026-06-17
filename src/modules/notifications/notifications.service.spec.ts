import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import {
  Notification,
  NotificationType,
} from './entities/notification.entities';
import { Comment } from '../comments/entities/comment.entities';
import { Message } from '../messages/entities/message.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };
  let commentRepo: { find: jest.Mock };
  let messageRepo: { find: jest.Mock };

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };
    commentRepo = { find: jest.fn().mockResolvedValue([]) };
    messageRepo = { find: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: repo,
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: commentRepo,
        },
        {
          provide: getRepositoryToken(Message),
          useValue: messageRepo,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates notifications', async () => {
    const dto = {
      user_id: 2,
      type: NotificationType.MESSAGE,
      related_id: 10,
      message: 'New message',
    };
    const created = { notification_id: 1, ...dto };

    repo.create.mockReturnValue(created);
    repo.save.mockResolvedValue(created);

    await expect(service.createNotification(dto)).resolves.toEqual(created);
    expect(repo.create).toHaveBeenCalledWith({
      user: { user_id: 2 },
      type: NotificationType.MESSAGE,
      related_id: 10,
      message: 'New message',
    });
    expect(repo.save).toHaveBeenCalledWith(created);
  });

  it('lists notifications for a user', async () => {
    const createdAt = new Date('2025-01-01T10:00:00Z');
    const rows = [
      {
        notification_id: 1,
        type: NotificationType.COMMENT,
        related_id: 20,
        message: 'New comment on your post',
        is_read: false,
        created_at: createdAt,
      },
    ];

    repo.findAndCount.mockResolvedValue([rows, 1]);

    await expect(
      service.getNotificationsByUser(1, { page: 0, size: 20 }),
    ).resolves.toEqual({
      total: 1,
      data: [
        {
          notification_id: 1,
          type: NotificationType.COMMENT,
          related_id: 20,
          message: 'New comment on your post',
          is_read: false,
          created_at: createdAt,
          target_path: null,
        },
      ],
    });
    expect(repo.findAndCount).toHaveBeenCalled();
  });

  it('resolves comment and message notification destinations', async () => {
    const createdAt = new Date('2026-06-11T00:00:00Z');
    repo.findAndCount.mockResolvedValue([
      [
        {
          notification_id: 1,
          type: NotificationType.COMMENT,
          related_id: 20,
          message: 'New comment on your post',
          is_read: false,
          created_at: createdAt,
        },
        {
          notification_id: 2,
          type: NotificationType.MESSAGE,
          related_id: 30,
          message: 'New message',
          is_read: false,
          created_at: createdAt,
        },
      ],
      2,
    ]);
    commentRepo.find.mockResolvedValue([
      { comment_id: 20, post: { post_id: 4 } },
    ]);
    messageRepo.find.mockResolvedValue([
      { message_id: 30, conversation_id: 9 },
    ]);

    await expect(service.getNotificationsByUser(1)).resolves.toEqual({
      total: 2,
      data: [
        expect.objectContaining({
          notification_id: 1,
          target_path: '/posts/4?commentId=20',
        }),
        expect.objectContaining({
          notification_id: 2,
          target_path: '/chat?conversationId=9&messageId=30',
        }),
      ],
    });
  });

  it('marks notifications as read', async () => {
    const notification = {
      notification_id: 1,
      is_read: false,
    };

    repo.findOne.mockResolvedValue(notification);
    repo.save.mockResolvedValue({ ...notification, is_read: true });

    await expect(service.markAsRead(1, 1)).resolves.toEqual({
      notification_id: 1,
      is_read: true,
    });
    expect(repo.save).toHaveBeenCalledWith({
      notification_id: 1,
      is_read: true,
    });
  });

  it('marks all unread notifications as read', async () => {
    repo.update.mockResolvedValue({ affected: 2 });

    await expect(service.markAllAsRead(1)).resolves.toEqual({ updated: 2 });
    expect(repo.update).toHaveBeenCalledWith(
      { user: { user_id: 1 }, is_read: false },
      { is_read: true },
    );
  });
});
