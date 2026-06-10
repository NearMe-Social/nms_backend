import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';

export interface GoogleUser {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): GoogleUser {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      throw new UnauthorizedException('Google account has no email');
    }

    return {
      googleId: profile.id,
      email: email.toLowerCase(),
      firstName: profile.name?.givenName ?? '',
      lastName: profile.name?.familyName ?? '',
      profileImage: profile.photos?.[0]?.value ?? null,
    };
  }
}