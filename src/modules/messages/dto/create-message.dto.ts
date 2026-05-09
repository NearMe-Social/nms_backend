import {
  IsInt,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateMessageDto {
  @IsInt()
  conversation_id!: number;

  @IsString()
  @IsNotEmpty()
  content!: string;
}