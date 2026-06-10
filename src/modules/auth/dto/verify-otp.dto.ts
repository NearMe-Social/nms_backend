import { IsEmail, IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class SendOtpDto {
  @IsEmail()
  email: string;
}

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsNumberString()
  @Length(6, 6)
  otp: string;
}
