import {existsSync} from "fs";

import Fastify from 'fastify';
import {connectAsync} from "mqtt";

import {API_HOST, API_PORT, GROUPS_FILE} from "./env.js";
import {store} from "./store.js";
import {apiRouter} from "./api/server.js";

// Load groups store
if (!existsSync(GROUPS_FILE)) {
    await store.write();
}
await store.read();

// Subscribe to MQTT topics
const mqtt = await connectAsync('mqtt://localhost');
await mqtt.subscribeAsync('vsb-eink/+/display/raw_1bpp/set');
await mqtt.subscribeAsync('vsb-eink/+/display/raw_4bpp/set');

mqtt.on('message', async (topic, message) => {
    const [prefix, target, command, format, ...rest] = topic.split('/');

    const existingGroup = store.data.groups.find(group => group.name === target);
    if (existingGroup === undefined) {
        return;
    }

    const panelsInGroup = existingGroup.panels ?? [];
    for (const panel of panelsInGroup) {
        await mqtt.publishAsync(`vsb-eink/${panel}/display/${format}/set`, message);
    }
});

// Start HTTP server
const httpServer = Fastify();
httpServer.register(apiRouter, { prefix: '/api' });
await httpServer.listen({
    port: API_PORT,
    host: API_HOST,
    listenTextResolver: (address) => {
        return `Listening on ${address}`;
    }
})