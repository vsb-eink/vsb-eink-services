import { RouteHandler } from 'fastify';

const handler: RouteHandler = async (request, reply) => {
	return { msg: 'hello world' };
};

export default handler;
