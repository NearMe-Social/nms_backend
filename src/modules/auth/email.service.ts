import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {
    sgMail.setApiKey(
      this.configService.getOrThrow<string>('SENDGRID_API_KEY'),
    );
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    await sgMail.send({
      to: email,
      from: this.configService.getOrThrow<string>('MAIL_FROM'),
      subject: 'Your NearMe Social OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto;">
          <h2 style="color: #0c9081;">NearMe Social</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing: 8px;">${otp}</h1>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p>If you did not request this code, ignore this email.</p>
        </div>
      `,
    });
  }
}