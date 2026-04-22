import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  visibility_radius: number;

  @IsOptional()
  @IsDateString()
  expires_at?: string;
}

export class CreatePostServiceDto {
  title: string;
  content: string;
  latitude: string;
  longitude: string;
  visibility_radius: number;
  expires_at?: string;
}