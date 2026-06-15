import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*$/, {
    message:
      'Username can only contain letters, numbers, underscores, and dots between characters',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  first_name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  last_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  bio?: string;

  @IsOptional()
  @IsString()
  profile_image?: string;
}
