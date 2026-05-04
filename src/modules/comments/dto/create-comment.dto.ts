import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
  @Type(() => Number)
  @IsInt()
  post_id: number;

  @Type(() => Number)
  @IsInt()
  user_id: number;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  content: string;
}
