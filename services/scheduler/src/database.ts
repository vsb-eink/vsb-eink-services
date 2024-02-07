import { PrismaClient } from '@prisma/client';

export function createDatabaseClient() {
	return new PrismaClient();
}

export const db = createDatabaseClient();
export * from '@prisma/client';
