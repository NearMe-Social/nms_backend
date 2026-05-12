import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { ChatGateway } from './chat.gateway';
import { Message } from './entities/message.entity';
import { ConversationsModule } from '../conversations/conversations.module';
import { BlocksModule } from '../blocks/blocks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'change_this_secret',
    }),
    ConversationsModule,
    BlocksModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService, ChatGateway],
  exports: [MessagesService],
})

export class MessagesModule {}