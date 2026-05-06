import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { ConversationParticipant } from '../conversations/entities/conversation-participant.entity';
import { MessagesService } from './messages.service';
import { MessageController } from './messages.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      ConversationParticipant,
    ]),
  ],
  controllers: [MessageController],
  providers: [MessagesService],
  exports: [MessagesService],
})

export class MessagesModule {}