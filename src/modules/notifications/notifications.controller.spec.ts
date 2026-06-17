import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: {
    getNotificationsByUser: jest.Mock;
    markAsRead: jest.Mock;
    markAllAsRead: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getNotificationsByUser: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns notifications for the current user', async () => {
    service.getNotificationsByUser.mockResolvedValue({ total: 0, data: [] });

    await expect(
      controller.getMyNotifications(
        { user: { userId: 5 } } as any,
        { page: 0, size: 20 },
      ),
    ).resolves.toEqual({ total: 0, data: [] });

    expect(service.getNotificationsByUser).toHaveBeenCalledWith(5, {
      page: 0,
      size: 20,
    });
  });

  it('marks notifications as read', async () => {
    service.markAsRead.mockResolvedValue({
      notification_id: 9,
      is_read: true,
    });

    await expect(
      controller.markRead(
        { user: { userId: 5 } } as any,
        9,
      ),
    ).resolves.toEqual({ notification_id: 9, is_read: true });

    expect(service.markAsRead).toHaveBeenCalledWith(5, 9);
  });

  it('marks all notifications as read', async () => {
    service.markAllAsRead.mockResolvedValue({ updated: 3 });

    await expect(
      controller.markAllRead({ user: { userId: 5 } } as any),
    ).resolves.toEqual({ updated: 3 });

    expect(service.markAllAsRead).toHaveBeenCalledWith(5);
  });
});
