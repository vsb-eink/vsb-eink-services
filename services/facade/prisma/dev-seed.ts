import { PrismaClient, Scope, Role } from '@prisma/facade-client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

await prisma.$transaction(async (tx) => {
	await tx.panelGroup.createMany({
		data: [{ id: 'debug' }, { id: 'all' }, { id: 'ec', name: 'EC1, EC2, EC3' }],
	});

	await tx.userGroup.create({
		data: {
			name: 'FEI Zaměstnanci',
			scopes: [Scope.SCHEDULE_READ, Scope.SCHEDULE_WRITE, Scope.PANELS_READ],
			managedPanelGroups: {
				connect: [{ id: 'ec' }],
			},
		},
	});
	await tx.userGroup.create({
		data: {
			name: 'Studenti',
			scopes: [Scope.PANELS_READ],
			managedPanelGroups: {
				connect: [{ id: 'all' }],
			},
		},
	});
	await tx.userGroup.create({
		data: {
			name: 'Správci',
			scopes: [
				Scope.HOSTED_READ,
				Scope.HOSTED_WRITE,
				Scope.PANELS_READ,
				Scope.PANELS_WRITE,
				Scope.USERS_READ,
				Scope.USERS_WRITE,
				Scope.SCHEDULE_READ,
				Scope.SCHEDULE_WRITE,
			],
			managedPanelGroups: {
				connect: [{ id: 'all' }, { id: 'debug' }],
			},
		},
	});

	await tx.user.create({
		data: { role: Role.ADMIN, username: 'admin', password: await argon2.hash('admin') },
	});
	await tx.user.create({
		data: {
			username: 'employee',
			password: await argon2.hash('employee'),
			groups: {
				connect: [{ name: 'FEI Zaměstnanci' }],
			},
		},
	});
	await tx.user.create({
		data: {
			username: 'student',
			password: await argon2.hash('student'),
			groups: {
				connect: [{ name: 'Studenti' }],
			},
		},
	});
	await tx.user.create({
		data: {
			username: 'spravce',
			password: await argon2.hash('spravce'),
			groups: {
				connect: [{ name: 'Správci' }],
			},
		},
	});
});
