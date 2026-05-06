import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @Type(() => Number)
  @IsLatitude()
  latitude: number;

  @Type(() => Number)
  @IsLongitude()
  longitude: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(50)
  @Max(50000)
  visibility_radius?: number = 200;

  @IsDateString()
  expires_at: string;

  @Type(() => Number)
  @IsInt()
  user_id: number;
}
