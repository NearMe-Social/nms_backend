import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { ConversationsService } from '../conversations/conversations.service';
import { ChatGateway } from './chat.gateway';
import { MessagesService } from './messages.service';

describe('ChatGateway presence', () => {
  let gateway: ChatGateway;
  let jwtService: { verify: jest.Mock };
  let conversationsService: { getPeerUserIds: jest.Mock };
  let roomSockets: Map<string, Set<string>>;
  let emittedEvents: Array<{
    room: string;
    event: string;
    payload: unknown;
  }>;

  beforeEach(() => {
    jwtService = {
      verify: jest.fn((token: string) => ({
        sub: token === 'user-2' ? 2 : 1,
      })),
    };
    conversationsService = {
      getPeerUserIds: jest.fn((userId: number) =>
        Promise.resolve(userId === 1 ? [2] : [1]),
      ),
    };
    roomSockets = new Map();
    emittedEvents = [];

    gateway = new ChatGateway(
      {} as MessagesService,
      jwtService as unknown as JwtService,
      conversationsService as unknown as ConversationsService,
    );
    gateway.server = {
      in: jest.fn((room: string) => ({
        fetchSockets: jest.fn(() =>
          Promise.resolve(
            Array.from(roomSockets.get(room) ?? []).map((id) => ({ id })),
          ),
        ),
      })),
      to: jest.fn((room: string) => ({
        emit: jest.fn((event: string, payload: unknown) => {
          emittedEvents.push({ room, event, payload });
        }),
      })),
    } as never;
  });

  function createClient(id: string, token = 'user-1') {
    const client = {
      id,
      data: {},
      handshake: {
        auth: { token },
        headers: {},
      },
      join: jest.fn(async (room: string) => {
        const sockets = roomSockets.get(room) ?? new Set<string>();
        sockets.add(id);
        roomSockets.set(room, sockets);
      }),
      emit: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as Socket;

    return client;
  }

  function removeClientFromRooms(clientId: string) {
    roomSockets.forEach((socketIds) => socketIds.delete(clientId));
  }

  it('should stay online until the final browser tab disconnects', async () => {
    const firstTab = createClient('socket-1');
    const secondTab = createClient('socket-2');

    await gateway.handleConnection(firstTab);
    await gateway.handleConnection(secondTab);

    expect(emittedEvents).toEqual([
      {
        room: 'user_2',
        event: 'presenceChanged',
        payload: { userId: 1, online: true },
      },
    ]);

    removeClientFromRooms(firstTab.id);
    await gateway.handleDisconnect(firstTab);
    expect(emittedEvents).toHaveLength(1);

    removeClientFromRooms(secondTab.id);
    await gateway.handleDisconnect(secondTab);
    expect(emittedEvents[1]).toEqual({
      room: 'user_2',
      event: 'presenceChanged',
      payload: { userId: 1, online: false },
    });
  });

  it('should only return presence for conversation peers', async () => {
    roomSockets.set('user_2', new Set(['peer-socket']));
    roomSockets.set('user_99', new Set(['unrelated-socket']));
    const client = createClient('socket-1');
    client.data.userId = 1;

    await expect(
      gateway.handleGetPresence({ userIds: [2, 99] }, client),
    ).resolves.toEqual({ onlineUserIds: [2] });
  });
});
