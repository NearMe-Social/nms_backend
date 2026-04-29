import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class NearbyPostsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(50)
  @Max(50000)
  radius? : number = 200;

  @IsOptional()
  @IsIn(['latest', 'active'])
  sort?: 'latest' | 'active' = 'latest';
}