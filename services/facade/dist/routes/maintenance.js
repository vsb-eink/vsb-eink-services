import { Role } from '../database.js';
import { verifyRole } from '../guards/role.js';
import { verifyJWT } from '../guards/jwt.js';
export const maintenanceRoutes = async (app, opts) => {
    app.route({
        method: 'POST',
        url: '/maintenance',
        onRequest: app.auth([verifyJWT, verifyRole(Role.ADMIN)]),
        handler: async (request, reply) => {
            // This should perform database synchronization and other maintenance tasks.
            return { success: true };
        },
    });
};
//# sourceMappingURL=maintenance.js.map