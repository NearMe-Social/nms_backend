import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  post_id!: string;

  @IsNotEmpty()
  @IsString()
  user_id!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  content!: string;
}
