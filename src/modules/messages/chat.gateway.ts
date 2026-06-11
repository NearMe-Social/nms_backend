import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from './messages.service';
import { UnauthorizedException } from '@nestjs/common';
import { ConversationsService } from '../conversations/conversations.service';

interface PresenceRequest {
  userIds?: number[];
}

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
    private readonly conversationsService: ConversationsService,
  ) {}

  // Authenticate on connection via JWT token in handshake
  async handleConnection(client: Socket) {
    let userId: number;

    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) throw new UnauthorizedException();
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'change_this_secret',
      });
      userId = Number(payload.sub);
      if (!Number.isInteger(userId) || userId <= 0) {
        throw new UnauthorizedException();
      }
    } catch {
      console.log('Unauthorized WebSocket connection, disconnecting...');
      client.disconnect();
      return;
    }

    client.data.userId = userId;
    await client.join(this.userRoom(userId));
    console.log(`Client connected: userId=${userId}`);

    try {
      const userSockets = await this.getUserSockets(userId);
      const peerUserIds =
        await this.conversationsService.getPeerUserIds(userId);
      const onlineUserIds = await this.getOnlineUserIds(peerUserIds);

      client.emit('presenceSnapshot', { onlineUserIds });

      if (userSockets.length === 1) {
        this.emitPresenceToUsers(peerUserIds, userId, true);
      }
    } catch (error) {
      console.error('Failed to initialize chat presence', error);
    }
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const userId = Number(client.data.userId);
    if (!Number.isInteger(userId) || userId <= 0) return;

    try {
      const remainingSockets = await this.getUserSockets(userId);
      if (remainingSockets.length > 0) return;

      const peerUserIds =
        await this.conversationsService.getPeerUserIds(userId);
      this.emitPresenceToUsers(peerUserIds, userId, false);
    } catch (error) {
      console.error('Failed to update chat presence after disconnect', error);
    }
  }

  @SubscribeMessage('getPresence')
  async handleGetPresence(
    @MessageBody() data: PresenceRequest,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = Number(client.data.userId);
    const peerUserIds = await this.conversationsService.getPeerUserIds(userId);
    const allowedPeerIds = new Set(peerUserIds);
    const requestedUserIds = Array.isArray(data?.userIds)
      ? Array.from(
          new Set(
            data.userIds
              .map(Number)
              .filter(
                (requestedId) =>
                  Number.isInteger(requestedId) &&
                  requestedId > 0 &&
                  allowedPeerIds.has(requestedId),
              ),
          ),
        )
      : peerUserIds;

    return {
      onlineUserIds: await this.getOnlineUserIds(requestedUserIds),
    };
  }

  // Join a conversation room
  @SubscribeMessage('joinConversation')
  async handleJoin(
    @MessageBody() conversationId: number,
    @ConnectedSocket() client: Socket,
  ) {
    await this.messagesService.getMessages(client.data.userId, conversationId, {
      page: 0,
      size: 1,
    });
    client.join(`conversation_${conversationId}`);
    return { event: 'joinedConversation', data: conversationId };
  }

  @SubscribeMessage('leaveConversation')
  handleLeave(
    @MessageBody() conversationId: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`conversation_${conversationId}`);
    client.to(`conversation_${conversationId}`).emit('typingStopped', {
      conversationId,
      userId: client.data.userId,
    });
    return { event: 'leftConversation', data: conversationId };
  }

  @SubscribeMessage('typingStarted')
  async handleTypingStarted(
    @MessageBody() data: { conversationId: number },
    @ConnectedSocket() client: Socket,
  ) {
    await this.messagesService.assertCanAccessConversation(
      client.data.userId,
      data.conversationId,
    );
    client.to(`conversation_${data.conversationId}`).emit('typingStarted', {
      conversationId: data.conversationId,
      userId: client.data.userId,
    });
  }

  @SubscribeMessage('typingStopped')
  async handleTypingStopped(
    @MessageBody() data: { conversationId: number },
    @ConnectedSocket() client: Socket,
  ) {
    await this.messagesService.assertCanAccessConversation(
      client.data.userId,
      data.conversationId,
    );
    client.to(`conversation_${data.conversationId}`).emit('typingStopped', {
      conversationId: data.conversationId,
      userId: client.data.userId,
    });
  }

  @SubscribeMessage('markSeen')
  async handleMarkSeen(
    @MessageBody() data: { conversationId: number },
    @ConnectedSocket() client: Socket,
  ) {
    await this.messagesService.markAsSeen(
      client.data.userId,
      data.conversationId,
    );
    this.server.to(`conversation_${data.conversationId}`).emit('messagesSeen', {
      conversationId: data.conversationId,
      userId: client.data.userId,
      readAt: new Date().toISOString(),
    });
  }

  // Send a message via WebSocket
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { conversationId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    try {
      const message = await this.messagesService.sendMessage(
        userId,
        data.conversationId,
        { content: data.content, conversation_id: data.conversationId },
      );
      const participantIds =
        await this.messagesService.getConversationParticipantIds(
          data.conversationId,
        );

      participantIds.forEach((participantId) => {
        this.server.to(`user_${participantId}`).emit('newMessage', message);
      });

      return { success: true, message };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  private userRoom(userId: number): string {
    return `user_${userId}`;
  }

  private getUserSockets(userId: number) {
    return this.server.in(this.userRoom(userId)).fetchSockets();
  }

  private async getOnlineUserIds(userIds: number[]): Promise<number[]> {
    const states = await Promise.all(
      userIds.map(async (userId) => ({
        userId,
        online: (await this.getUserSockets(userId)).length > 0,
      })),
    );

    return states.filter((state) => state.online).map((state) => state.userId);
  }

  private emitPresenceToUsers(
    recipientUserIds: number[],
    userId: number,
    online: boolean,
  ) {
    recipientUserIds.forEach((recipientUserId) => {
      this.server
        .to(this.userRoom(recipientUserId))
        .emit('presenceChanged', { userId, online });
    });
  }
}
