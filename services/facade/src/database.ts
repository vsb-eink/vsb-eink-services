import { PrismaClient, Prisma, Role } from './generated/@prisma/facade-client/index.js';
export * from './generated/@prisma/facade-client/index.js';

import { events } from './events.js';
import argon2 from 'argon2';
import { DEFAULT_ADMIN_PASSWORD } from './environment.js';

type PanelOperations = keyof (typeof db)['panel'];

export const MUTATING_OPERATIONS: PanelOperations[] = [
	'create',
	'createMany',
	'deleteMany',
	'delete',
	'update',
	'updateMany',
	'upsert',
];

function notifyOnChange({ operation, model }: { operation: PanelOperations; model: string }) {
	if (!MUTATING_OPERATIONS.includes(operation)) return;
	events.emit(`${model}:change`, { operation });
}

export const db = new PrismaClient().$extends({
	query: {
		panel: {
			$allOperations: ({ operation, model, query, args }) => {
				notifyOnChange({ operation, model: 'panel' });
				return query(args);
			},
		},
		panelGroup: {
			$allOperations: ({ operation, model, query, args }) => {
				notifyOnChange({ operation, model: 'panelGroup' });
				return query(args);
			},
		},
	},
});

export async function ensureDatabaseHasAdminSetup() {
	const admin = await db.user.findFirst({ where: { role: 'ADMIN' } });
	if (admin) return;

	await db.user.create({
		data: {
			username: 'admin',
			role: Role.ADMIN,
			password: await argon2.hash(DEFAULT_ADMIN_PASSWORD),
		},
	});
}

export function isDatabaseError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
	return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function isNotFoundError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
	return isDatabaseError(error) && error.code === 'P2025';
}
