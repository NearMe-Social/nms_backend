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

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
  ) {}

  // Authenticate on connection via JWT token in handshake
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) throw new UnauthorizedException();
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'change_this_secret',
      });
      client.data.userId = payload.sub;
      console.log(`Client connected: userId=${payload.sub}`);
    } catch {
      console.log('Unauthorized WebSocket connection, disconnecting...');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
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
        { content: data.content },
      );
      // Broadcast to all participants in the conversation room
      this.server.to(`conversation_${data.conversationId}`).emit('newMessage', message);
      return { success: true, message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
