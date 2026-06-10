import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsOptional()
  @IsInt()
  conversation_id?: number;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
