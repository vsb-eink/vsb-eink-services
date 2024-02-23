import { PrismaClient } from '@prisma/scheduler-client';

export function createDatabaseClient() {
	return new PrismaClient();
}

export const db = createDatabaseClient();
export * from '@prisma/scheduler-client';
