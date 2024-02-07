import { Agent as HttpsAgent } from 'node:https';
import { RouteHandler } from 'fastify';
import axios from 'axios';

const handler: RouteHandler<{ Querystring: { url?: string } }> = async (request, reply) => {
	const url = request.query['url'];

	if (url === undefined) {
		reply.code(400);
		return 'Missing "url" query parameter';
	}

	const remoteResponse = await axios({
		url,
		headers: request.headers,
		method: request.method,
		data: request.body,
		validateStatus: () => true,
		httpsAgent: new HttpsAgent({
			rejectUnauthorized: false,
		}),
	});

	reply.code(remoteResponse.status);
	for (const key of Object.keys(remoteResponse.headers)) {
		reply.header(key, remoteResponse.headers[key]);
	}

	return remoteResponse.data;
};

export default handler;
