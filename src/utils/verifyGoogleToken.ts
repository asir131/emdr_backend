import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { ApiError } from './ApiError';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  emailVerified: boolean;
}

export const verifyGoogleToken = async (idToken: string): Promise<GoogleUserInfo> => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) throw new Error('Invalid token payload');

    return {
      googleId:      payload.sub,
      email:         payload.email,
      firstName:     payload.given_name  || payload.name?.split(' ')[0] || 'User',
      lastName:      payload.family_name || payload.name?.split(' ')[1] || '',
      avatar:        payload.picture,
      emailVerified: payload.email_verified ?? false,
    };
  } catch {
    throw new ApiError(401, 'INVALID_GOOGLE_TOKEN', 'Google token verification failed');
  }
};
