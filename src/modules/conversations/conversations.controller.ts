import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateConversationDto) {
    return this.conversationsService.create(req.user.userId, dto);
  }

  @Get()
  findMine(@Req() req: any) {
    return this.conversationsService.findForUser(req.user.userId);
  }

  @Get(':conversationId')
  findOne(
    @Req() req: any,
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ) {
    return this.conversationsService.findOneForUser(
      conversationId,
      req.user.userId,
    );
  }
}
