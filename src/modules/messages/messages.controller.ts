import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('conversations/:conversationId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  sendMessage(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
    @Body('content') content: string,
  ) {
    return this.messagesService.sendMessage(req.user.userId, +conversationId, content);
  }

  @Get()
  getMessages(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
  ) {
    return this.messagesService.getMessages(req.user.userId, +conversationId);
  }
}
