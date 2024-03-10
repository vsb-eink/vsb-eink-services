import { PrismaClient } from '@prisma/client';

const MAX_TASKS = 20;
const TARGETS = ['all', 'ec1', 'ec2', 'ec3', 'luk0125', 'debug'];
for (let i = 0; i < 20; ++i) {
	TARGETS.push(`e${i.toString()}`);
}

function getRandomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min)) + min;
}

const prisma = new PrismaClient();

await prisma.$transaction(
	async (tx) => {
		for (const target of TARGETS) {
			for (let i = 0; i < MAX_TASKS / 2; ++i) {
				const seconds = getRandomInt(0, 59);
				const minutes = getRandomInt(0, 59);
				const hours = getRandomInt(0, 23);
				const days = getRandomInt(1, 31);
				const months = getRandomInt(1, 12);

				await tx.eInkJob.create({
					data: {
						target,
						cron: `${minutes} ${hours} ${days} ${months} *`,
						priority: getRandomInt(0, 100),
						command: 'display',
						commandType: 'url_4bpp',
						commandArgs: JSON.stringify([
							getRandomInt(0, 100).toString(),
							getRandomInt(0, 100).toString(),
							getRandomInt(0, 100).toString(),
							getRandomInt(0, 100).toString(),
							getRandomInt(0, 100).toString(),
						]),
						hasSeconds: false,
					},
				});

				await tx.eInkJob.create({
					data: {
						target,
						cron: `${seconds} ${minutes} ${hours} ${days} ${months} *`,
						priority: getRandomInt(0, 100),
						command: 'display',
						commandType: 'url_4bpp',
						commandArgs: JSON.stringify([
							getRandomInt(0, 100).toString(),
							getRandomInt(0, 100).toString(),
							getRandomInt(0, 100).toString(),
							getRandomInt(0, 100).toString(),
							getRandomInt(0, 100).toString(),
						]),
						hasSeconds: true,
					},
				});
			}

			await tx.eInkJob.create({
				data: {
					target,
					cron: `* * * * *`,
					priority: getRandomInt(0, 100),
					command: 'display',
					commandType: 'url_4bpp',
					commandArgs: JSON.stringify([
						getRandomInt(0, 100).toString(),
						getRandomInt(0, 100).toString(),
						getRandomInt(0, 100).toString(),
						getRandomInt(0, 100).toString(),
						getRandomInt(0, 100).toString(),
					]),
					hasSeconds: false,
				},
			});

			await tx.eInkJob.create({
				data: {
					target,
					cron: `* * * * * *`,
					priority: getRandomInt(0, 100),
					command: 'display',
					commandType: 'url_4bpp',
					commandArgs: JSON.stringify([
						getRandomInt(0, 100).toString(),
						getRandomInt(0, 100).toString(),
						getRandomInt(0, 100).toString(),
						getRandomInt(0, 100).toString(),
						getRandomInt(0, 100).toString(),
					]),
					hasSeconds: true,
				},
			});
		}
	},
	{ timeout: 1000 * 60 },
);

process.on('exit', async () => {
	await prisma.$disconnect();
});
