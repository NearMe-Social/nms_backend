import { IsInt, IsPositive, IsNotEmpty } from 'class-validator';

export class CreateConversationDto {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  recipientId: number;
}
