import Fastify from 'fastify';
import FastifySensible from '@fastify/sensible';
import FastifyJWT from '@fastify/jwt';
import FastifyAuth from '@fastify/auth';
import FastifyGuard from 'fastify-guard';
import FastifyCors from '@fastify/cors';
import { routes } from './routes/index.js';
export function createServer(opts) {
    const app = Fastify(opts);
    app.register(FastifySensible, { sharedSchemaId: 'HttpError' });
    app.register(FastifyGuard.default);
    app.register(FastifyJWT, { secret: 'hunter2' });
    app.register(FastifyAuth, { defaultRelation: 'and' });
    app.register(FastifyCors);
    app.register(routes, { prefix: '/' });
    return app;
}
//# sourceMappingURL=server.js.map