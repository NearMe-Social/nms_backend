import { IsIn, IsOptional } from 'class-validator';

export class PostsQueryDto {
  @IsOptional()
  @IsIn(['latest', 'active'])
  sort?: 'latest' | 'active' = 'latest';
}
