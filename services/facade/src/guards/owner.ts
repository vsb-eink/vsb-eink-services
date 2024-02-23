import { FastifyRequest, onRequestHookHandler } from 'fastify';
import { db } from '../database.js';

function includesGroupId(
	request: FastifyRequest,
): request is FastifyRequest<{ Params: { id: string } }> {
	return !!(request.params as any).id;
}

export const verifyAccessToPanelGroup: onRequestHookHandler = async (request, reply) => {
	try {
		if (!includesGroupId(request)) {
			return reply.internalServerError('No group id found in request params');
		}

		const group = await db.panelGroup.findFirst({
			where: {
				id: request.params.id,
				managedBy: {
					some: {
						users: {
							some: {
								id: request.user.id,
							},
						},
					},
				},
			},
		});

		if (group === null) {
			return reply.forbidden();
		}
	} catch (error) {
		request.log.error(error);
		return reply.unauthorized();
	}
};

function includesPanelId(
	request: FastifyRequest,
): request is FastifyRequest<{ Params: { id: string } }> {
	return !!(request.params as any).id;
}

export const verifyAccessToPanel: onRequestHookHandler = async (request, reply) => {
	try {
		if (!includesPanelId(request)) {
			return reply.internalServerError('No panel id found in request params');
		}

		const panel = await db.panel.findFirst({
			where: {
				id: request.params.id,
				groups: {
					some: {
						managedBy: {
							some: {
								users: {
									some: {
										id: request.user.id,
									},
								},
							},
						},
					},
				},
			},
		});

		if (panel === null) {
			return reply.forbidden();
		}
	} catch (error) {
		request.log.error(error);
		return reply.unauthorized();
	}
};

function includesUserId(
	request: FastifyRequest,
): request is FastifyRequest<{ Params: { id: number } }> {
	return !!(request.params as any).id;
}
export const verifyProfileOwner: onRequestHookHandler = async (request, reply) => {
	if (!includesUserId(request)) {
		return reply.internalServerError('No user id found in request params');
	}

	if (request.params.id !== request.user.id) {
		return reply.forbidden();
	}
};
