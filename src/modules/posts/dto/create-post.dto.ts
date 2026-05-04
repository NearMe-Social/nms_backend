import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsDateString()
  expires_at: string;

  @Type(() => Number)
  @IsInt()
  user_id: number;
}
