import { PrismaClient, Prisma } from '@prisma/facade-client';
export * from '@prisma/facade-client';

import { events } from './events.js';

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

export function isDatabaseError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
	return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function isNotFoundError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
	return isDatabaseError(error) && error.code === 'P2025';
}
