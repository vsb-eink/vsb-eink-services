#!/usr/bin/env node
import 'dotenv/config';
import { createServer } from './server.js';
import { API_HOST, API_PORT } from './environment.js';
const server = createServer();
await server.listen({
    host: API_HOST,
    port: API_PORT,
    listenTextResolver: (address) => {
        return `Listening on ${address}`;
    },
});
//# sourceMappingURL=vsb-eink-facade.js.map