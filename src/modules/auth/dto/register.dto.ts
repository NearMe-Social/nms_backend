import { IsEmail, IsNotEmpty, MinLength, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { Gender } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  first_name: string;

  @IsNotEmpty()
  last_name: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsOptional()
  @IsDateString()
  birthday: string;

  @IsOptional()
  @IsEnum(Gender)
  gender: Gender;
}
