import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { panelsRoutes } from './panels.js';
import { panelGroupsRoutes } from './panel-groups.js';
import { userGroupsRoutes } from './user-groups.js';
import { usersRoutes } from './users.js';
import { scheduleRoutes } from './schedule.js';
import { hostedRoutes } from './hosted/index.js';
import { authRoutes } from './auth.js';
import { profileRoutes } from './profile.js';
import { maintenanceRoutes } from './maintenance.js';

export const routes: FastifyPluginAsyncTypebox = async (app, opts) => {
	app.register(authRoutes, { prefix: '/auth' });

	app.register(panelsRoutes, { prefix: '/panels' });
	app.register(panelGroupsRoutes, { prefix: '/panel-groups' });

	app.register(profileRoutes, { prefix: '/profile' });
	app.register(usersRoutes, { prefix: '/users' });
	app.register(userGroupsRoutes, { prefix: '/user-groups' });

	app.register(scheduleRoutes, { prefix: '/schedule' });

	app.register(hostedRoutes, { prefix: '/hosted' });

	app.register(maintenanceRoutes, { prefix: '/maintenance' });
};
