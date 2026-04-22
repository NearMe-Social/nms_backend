import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class NearbyPostsDto {
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  radius?: number;
}