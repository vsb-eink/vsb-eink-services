import { PrismaClient } from '@prisma/grouper-client';
export * from '@prisma/grouper-client';

export const db = new PrismaClient();
