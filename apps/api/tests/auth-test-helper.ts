import { prisma } from '@studyquest/db';
import { app } from '../src/app.js';

const APP_ORIGIN = 'http://localhost:3000';
export const TEST_PASSWORD = 'correct horse battery staple 2026';

type CreateAuthenticatedTestUserOptions = {
  email: string;
  name: string;
};

export async function createAuthenticatedTestUser({
  email,
  name,
}: CreateAuthenticatedTestUserOptions) {
  const signUpResponse = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: APP_ORIGIN,
    },
    body: JSON.stringify({
      email,
      password: TEST_PASSWORD,
      name,
      callbackURL: '/dashboard',
    }),
  });

  if (!signUpResponse.ok) {
    throw new Error(`Test user sign-up failed with ${signUpResponse.status}.`);
  }

  const user = await prisma.user.update({
    where: { email },
    data: { emailVerified: true },
  });

  const signInResponse = await signInTestUser(email, TEST_PASSWORD);

  if (!signInResponse.ok) {
    throw new Error(`Test user sign-in failed with ${signInResponse.status}.`);
  }

  const cookie = getSessionCookie(signInResponse);

  return {
    userId: user.id,
    cookie,
  };
}

export function signInTestUser(email: string, password: string) {
  return app.request('/api/auth/sign-in/email', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: APP_ORIGIN,
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export function getSessionCookie(response: Response) {
  const setCookie = response.headers.get('set-cookie');
  const cookie = setCookie?.match(
    /(?:^|, )([^;,]*studyquest\.session_token=[^;]+)/,
  )?.[1];

  if (!cookie) {
    throw new Error('Test user sign-in did not return a session cookie.');
  }

  return cookie;
}

export function authenticatedHeaders(cookie: string, includeJson = false) {
  return {
    cookie,
    origin: APP_ORIGIN,
    ...(includeJson ? { 'content-type': 'application/json' } : {}),
  };
}
