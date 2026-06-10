import { IsEnum } from 'class-validator';

import { MessageStatus } from '../enums/message-status.enum';

export class UpdateMessageStatusDto {
  @IsEnum(MessageStatus)
  status!: MessageStatus;
}