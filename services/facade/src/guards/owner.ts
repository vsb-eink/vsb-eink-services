import { FastifyRequest, onRequestHookHandler } from 'fastify';
import { db } from '../database.js';
import { httpErrors } from '@fastify/sensible';

function includesGroupId(
	request: FastifyRequest,
): request is FastifyRequest<{ Params: { panelGroupId: string } }> {
	return !!(request.params as any).panelGroupId;
}

export const verifyAccessToPanelGroup: onRequestHookHandler = async (request, reply) => {
	if (!includesGroupId(request)) {
		throw httpErrors.internalServerError('No group id found in request params');
	}

	const group = await db.panelGroup.findFirst({
		where: {
			id: request.params.panelGroupId,
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
		throw httpErrors.forbidden();
	}
};

function includesPanelId(
	request: FastifyRequest,
): request is FastifyRequest<{ Params: { panelId: string } }> {
	return !!(request.params as any).panelId;
}

export const verifyAccessToPanel: onRequestHookHandler = async (request, reply) => {
	if (!includesPanelId(request)) {
		throw httpErrors.internalServerError('No panel id found in request params');
	}

	const panel = await db.panel.findFirst({
		where: {
			id: request.params.panelId,
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
		throw httpErrors.forbidden();
	}
};

function includesUserId(
	request: FastifyRequest,
): request is FastifyRequest<{ Params: { userId: number } }> {
	return !!(request.params as any).userId;
}
export const verifyProfileOwner: onRequestHookHandler = async (request, reply) => {
	if (!includesUserId(request)) {
		throw httpErrors.internalServerError('No user id found in request params');
	}

	if (request.params.userId !== request.user.id) {
		throw httpErrors.forbidden();
	}
};
