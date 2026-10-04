import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient();

export const googleAuthEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';
