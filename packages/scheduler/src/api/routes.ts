import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';

import { HttpErrorSchema, EmptyBodySchema } from './schemas.js';
import { loadJobsFromCrontab, readCrontabFile, writeCrontabFile } from '../crontab.js';
import { CRONTAB_PATH } from '../environment.js';

export const crontabRouter: FastifyPluginAsyncTypebox = async (app) => {
	app.get(
		'/',
		{
			schema: {
				response: {
					200: Type.String(),
				},
			},
		},
		async () => {
			return readCrontabFile(CRONTAB_PATH);
		},
	);

	app.put(
		'/',
		{
			schema: {
				response: {
					204: EmptyBodySchema,
					400: HttpErrorSchema,
				},
				body: Type.String(),
			},
		},
		async (request, reply) => {
			const crontab = request.body;

			if (crontab === undefined) {
				return reply.badRequest();
			}

			try {
				await loadJobsFromCrontab(CRONTAB_PATH);
			} catch {
				return reply.badRequest();
			}

			await writeCrontabFile(CRONTAB_PATH, crontab);
			return reply.status(204);
		},
	);
};
