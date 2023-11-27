import {FastifyPluginAsync} from "fastify";
import {groupsRouter} from "./routes.js";

export const apiRouter: FastifyPluginAsync = async (app, opts) => {
    app.register(groupsRouter, { prefix: '/groups' });
};