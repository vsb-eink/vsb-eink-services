import { RouteHandler } from 'fastify';

const handler: RouteHandler = async (request, reply) => {
	if (!request.query['url']) {
		return reply.status(400).send('No URL provided');
	}

	const url = decodeURIComponent(request.query['url'] as string);

	try {
		const response = await fetch(url);
		const content = Buffer.from(await response.arrayBuffer());
		return reply.status(response.status).type(response.headers.get('Content-Type')).send(content);
	} catch (e) {
		return reply.status(500).send(e.message);
	}
};

export default handler;
