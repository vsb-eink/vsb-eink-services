import { PrismaClient } from '@prisma/scheduler-client';

const prisma = new PrismaClient();

await prisma.$transaction(async (tx) => {
	await tx.eInkJob.create({
		data: {
			id: 1,
			target: 'all',
			cron: '*/10 * * * * *',
			command: 'display',
			commandType: 'url_1bpp',
			commandArgs: JSON.stringify([
				'https://upload.wikimedia.org/wikipedia/en/7/7d/Lenna_%28test_image%29.png',
			]),
			hasSeconds: true,
		},
	});
});
