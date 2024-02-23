import { PrismaClient } from '@prisma/grouper-client';

const prisma = new PrismaClient();

await prisma.$transaction(async (tx) => {
	await tx.group.create({
		data: {
			id: 'all',
			panels: {
				create: [{ id: 'luk0125_debug' }, { id: 'ec1' }],
			},
		},
	});
});
