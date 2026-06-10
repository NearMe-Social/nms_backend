import { Transform } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SearchPostsQueryDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  q: string;

  @Transform(({ value }: { value: unknown }): number => Number(value))
  @IsLatitude()
  lat: number;

  @Transform(({ value }: { value: unknown }): number => Number(value))
  @IsLongitude()
  lng: number;
}
