import { db } from '../database.js';
function includesGroupId(request) {
    return !!request.params.id;
}
export const verifyAccessToPanelGroup = async (request, reply) => {
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
    }
    catch (error) {
        request.log.error(error);
        return reply.unauthorized();
    }
};
function includesPanelId(request) {
    return !!request.params.id;
}
export const verifyPanelOwner = async (request, reply) => {
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
    }
    catch (error) {
        request.log.error(error);
        return reply.unauthorized();
    }
};
//# sourceMappingURL=owner.js.map