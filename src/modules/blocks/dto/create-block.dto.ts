import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateBlockDto {
  @IsInt()
  @IsNotEmpty()
  blocker_id: number;

  @IsInt()
  @IsNotEmpty()
  blocked_user_id: number;
}