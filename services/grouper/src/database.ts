import { PrismaClient } from './generated/@prisma/grouper-client/index.js';
export * from './generated/@prisma/grouper-client/index.js';

export const db = new PrismaClient();
