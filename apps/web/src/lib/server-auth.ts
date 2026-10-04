import 'server-only';
import { headers } from 'next/headers';
import { cache } from 'react';

type ServerSession = {
  session: {
    id: string;
    expiresAt: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
  };
};

const API_INTERNAL_URL =
  process.env.API_INTERNAL_URL ?? 'http://localhost:3001';

export const getServerSession = cache(
  async (): Promise<ServerSession | null> => {
    const requestHeaders = await headers();
    const cookie = requestHeaders.get('cookie');

    if (!cookie) {
      return null;
    }

    try {
      const response = await fetch(`${API_INTERNAL_URL}/api/auth/get-session`, {
        headers: { cookie },
        cache: 'no-store',
      });

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as ServerSession | null;
    } catch {
      return null;
    }
  },
);
