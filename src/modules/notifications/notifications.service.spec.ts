import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType } from './entities/notification.entities';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    findAndCount: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: repo,
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

    await expect(service.getNotificationsByUser(1, { page: 0, size: 20 }))
      .resolves.toEqual({
        total: 1,
        data: [
          {
            notification_id: 1,
            type: NotificationType.COMMENT,
            related_id: 20,
            message: 'New comment on your post',
            is_read: false,
            created_at: createdAt,
          },
        ],
      });
    expect(repo.findAndCount).toHaveBeenCalled();
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
});
