import { RouteHandlerMethod } from "fastify";

const handler: RouteHandlerMethod = async (request, reply) => {
    return `Hello, from folder!`;
};

export default handler;