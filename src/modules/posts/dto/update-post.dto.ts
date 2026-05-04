import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsDateString()
  expires_at?: string;
}
