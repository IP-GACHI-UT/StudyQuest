import { prisma } from '@studyquest/db';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { haveIBeenPwned } from 'better-auth/plugins';
import type { MiddlewareHandler } from 'hono';
import { errorResponse } from './api-response.js';
import { sendActionEmail } from './mailer.js';

const DAY_IN_SECONDS = 60 * 60 * 24;
const APP_ORIGIN = process.env.APP_ORIGIN ?? 'http://localhost:3000';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

function getTrustedProxies() {
  const trustedProxies = (process.env.TRUSTED_PROXY_IPS ?? '127.0.0.1,::1')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (isProduction && !process.env.TRUSTED_PROXY_IPS) {
    throw new Error('TRUSTED_PROXY_IPS is required in production.');
  }

  return trustedProxies;
}

function getAuthSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (isProduction) {
    throw new Error('BETTER_AUTH_SECRET is required in production.');
  }

  return 'studyquest-development-secret-change-before-production';
}

function getGoogleProvider() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {};
  }

  return {
    google: {
      clientId,
      clientSecret,
      scope: ['openid', 'email', 'profile'],
    },
  };
}

export const auth = betterAuth({
  appName: 'StudyQuest',
  baseURL: APP_ORIGIN,
  basePath: '/api/auth',
  secret: getAuthSecret(),
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
    transaction: true,
  }),
  trustedOrigins: [APP_ORIGIN],
  user: {
    fields: {
      name: 'displayName',
    },
  },
  emailVerification: {
    expiresIn: 60 * 60,
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendActionEmail({
        to: user.email,
        subject: 'StudyQuest メールアドレス確認',
        heading: 'メールアドレスを確認してください',
        message:
          'StudyQuestへの登録を完了するため、下のボタンからメールアドレスを確認してください。リンクは1時間有効です。',
        actionLabel: 'メールアドレスを確認する',
        actionUrl: url,
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: 15,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendActionEmail({
        to: user.email,
        subject: 'StudyQuest パスワード再設定',
        heading: 'パスワードを再設定します',
        message:
          '下のボタンから新しいパスワードを設定してください。リンクは1時間有効で、一度だけ使用できます。',
        actionLabel: 'パスワードを再設定する',
        actionUrl: url,
      });
    },
  },
  socialProviders: getGoogleProvider(),
  session: {
    expiresIn: DAY_IN_SECONDS * 7,
    updateAge: DAY_IN_SECONDS,
  },
  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      disableImplicitLinking: false,
      trustedProviders: ['google'],
      allowDifferentEmails: false,
      allowUnlinkingAll: false,
    },
  },
  rateLimit: {
    enabled: !isTest,
    storage: 'database',
    window: 60,
    max: 100,
    customRules: {
      '/sign-up/email': { window: 15 * 60, max: 5 },
      '/sign-in/email': { window: 15 * 60, max: 5 },
      '/request-password-reset': { window: 15 * 60, max: 3 },
      '/send-verification-email': { window: 15 * 60, max: 3 },
    },
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'],
      trustedProxies: getTrustedProxies(),
    },
    useSecureCookies: isProduction,
    cookiePrefix: 'studyquest',
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isProduction,
    },
  },
  plugins: isTest
    ? []
    : [
        haveIBeenPwned({
          customPasswordCompromisedMessage:
            '漏えいが確認されたパスワードは使用できません。別のパスワードを設定してください。',
        }),
      ],
});

type AuthSession = typeof auth.$Infer.Session;

export type AuthEnv = {
  Variables: {
    user: AuthSession['user'];
    session: AuthSession['session'];
  };
};

export const requireAuth: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return errorResponse(
      'AUTHENTICATION_REQUIRED',
      'ログインが必要です。',
      401,
    );
  }

  c.set('user', session.user);
  c.set('session', session.session);
  await next();
};
