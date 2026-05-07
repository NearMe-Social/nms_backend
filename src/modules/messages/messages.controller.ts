import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';
import { MessagesService } from './messages.service';

@UseGuards(JwtAuthGuard)
@Controller('conversations/:conversationId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  sendMessage(
    @Req() req: any,
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.sendMessage(req.user.userId, conversationId, dto);
  }

  @Get()
  getMessages(
    @Req() req: any,
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query() query: QueryMessagesDto,
  ) {
    return this.messagesService.getMessages(
      req.user.userId,
      conversationId,
      query,
    );
  }

  @Patch('seen')
  markSeen(
    @Req() req: any,
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ) {
    return this.messagesService.markAsSeen(req.user.userId, conversationId);
  }
}
