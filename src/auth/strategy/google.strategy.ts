import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      clientID: configService.get<string>('google.clientId') as string,
      clientSecret: configService.get<string>('google.clientSecret') as string,
      callbackURL: configService.get<string>('google.callbackUrl') as string,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<void> {
    const { id, emails, displayName, photos } = profile;
    const email = emails?.[0]?.value;
    const avatarUrl = photos?.[0]?.value ?? null;

    const user = await this.usersService.findOrCreateByGoogle({
      googleId: id,
      email,
      name: displayName,
      avatarUrl,
    });

    done(null, user);
  }
}
