import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  Strategy,
  'google',
) {
  
    constructor(
  private readonly configService: ConfigService,
) {

  console.log(
    'GOOGLE_CLIENT_ID:',
    configService.get('GOOGLE_CLIENT_ID'),
  );

  console.log(
    'GOOGLE_CALLBACK_URL:',
    configService.get('GOOGLE_CALLBACK_URL'),
  );

  super({
    clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
    clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
    callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
    scope: ['email', 'profile'],
  });
}

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ) {
    return {
      email: profile.emails?.[0]?.value,
      first_name: profile.name?.givenName,
      last_name: profile.name?.familyName,
      profile_image: profile.photos?.[0]?.value,
    };
  }
}