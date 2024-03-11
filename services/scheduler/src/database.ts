import { PrismaClient } from './generated/@prisma/scheduler-client/index.js';
export * from './generated/@prisma/scheduler-client/index.js';

export function createDatabaseClient() {
	return new PrismaClient();
}

export const db = createDatabaseClient();

