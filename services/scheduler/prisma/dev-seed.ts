import { PrismaClient } from '../src/generated/@prisma/scheduler-client/index.js';

const prisma = new PrismaClient();

await prisma.$transaction(async (tx) => {
	await tx.eInkJob.create({
		data: {
			id: 1,
			target: 'all',
			name: 'Lenna',
			description: 'Lenna test image',
			cron: '*/10 * * * * *',
			command: 'display/url_1bpp/set',
			content: JSON.stringify([
				'https://upload.wikimedia.org/wikipedia/en/7/7d/Lenna_%28test_image%29.png',
			]),
			precise: true,
		},
	});
});
