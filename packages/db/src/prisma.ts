import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import type { Quest, StudyLog, UserQuest } from '@prisma/client';
import { Prisma, PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

const rootEnvPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../.env',
);

config({ path: rootEnvPath });

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient, Quest, StudyLog, UserQuest };
export { Prisma };
