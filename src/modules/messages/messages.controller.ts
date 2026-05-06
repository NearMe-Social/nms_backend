// src/message/message.controller.ts
import {
  Controller, Post, Get, Body, Param, Query, Req, ParseIntPipe
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessagesService) {}

 
  @Post()
  sendMessage(@Req() req, @Body() dto: CreateMessageDto) {
    const userId = req.user.id; 
    return this.messageService.sendMessage(userId, dto);
  }


  @Get('conversation/:conversationId')
  getMessages(
    @Req() req,
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query() query: QueryMessagesDto,
  ) {
    const userId = req.user.id;
    return this.messageService.getMessagesByConversation(
      userId,
      conversationId,
      query.page,
      query.size,
    );
  }

 
  @Post('conversation/:conversationId/seen')
  markSeen(
    @Req() req,
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ) {
    const userId = req.user.id;
    return this.messageService.markAsSeen(userId, conversationId);
  }
}