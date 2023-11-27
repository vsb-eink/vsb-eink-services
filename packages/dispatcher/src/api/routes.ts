import {FastifyPluginAsync} from "fastify";
import {store} from "../store.js";
import {FastifyTypebox} from "./types.js";
import {
    GroupType, GroupNameType,
    GroupNameSchema,
    GroupsType,
    GroupSchema,
    GroupsSchema,
    UpdatableGroupType,
    UpdatableGroupSchema, PanelNameSchema, PanelsType, PanelsSchema, PanelNameType
} from "../schemas.js";
import {Static, Type} from "@sinclair/typebox";

export const groupsRouter: FastifyPluginAsync = async (app: FastifyTypebox, opts) => {
    app.get<{Reply: GroupsType}>('/', {
        schema: {
            response: {
                200: GroupsSchema
            }
        }
    }, async (req, reply) => {
        return store.data.groups;
    });

    app.post<{Body: GroupType, Reply: GroupsType}>('/', {
        schema: {
            body: GroupSchema,
            response: {
                201: GroupSchema
            }
        }
    }, async (req, reply) => {
        const { name, panels } = req.body;

        const existingGroup = store.data.groups.find(group => group.name === name);
        if (existingGroup !== undefined) {
            reply.status(409);
            return store.data.groups;
        }

        store.data.groups.push({ name, panels });
        await store.write();

        reply.status(201);
        return store.data.groups;
    });

    app.put<{Body: GroupsType, Reply: GroupsType}>('/', {
        schema: {
            body: GroupsSchema,
            response: {
                200: GroupsSchema
            }
        }
    },async (req, reply) => {
        const groups = req.body;
        store.data.groups = groups;
        await store.write();
        return store.data.groups;
    });

    app.register(groupRouter);
}

const GroupPathParamsSchema = Type.Object({
    groupName: GroupNameSchema
});
type GroupPathParamsType = Static<typeof GroupPathParamsSchema>;
export const groupRouter: FastifyPluginAsync = async (app: FastifyTypebox, opts) => {
    app.get<{Reply: GroupType, Params: GroupPathParamsType}>('/groupName', {
        schema: {
            params: GroupPathParamsSchema,
            response: {
                200: GroupSchema
            }
        }
    }, async (req, reply) => {
        const { groupName } = req.params;

        const existingGroup = store.data.groups.find(group => group.name === groupName);
        if (existingGroup === undefined) {
            reply.status(404);
            return;
        }

        return existingGroup;
    });

    app.patch<{Body: UpdatableGroupType, Reply: GroupType, Params: GroupPathParamsType}>('/groupName', {
        schema: {
            body: UpdatableGroupSchema,
            params: GroupPathParamsSchema,
            response: {
                200: GroupSchema
            }
        }
    },async (req, reply) => {
        const { groupName } = req.params;
        const { panels } = req.body;

        const existingGroup = store.data.groups.find(group => group.name === groupName);
        if (existingGroup === undefined) {
            reply.status(404);
            return;
        }

        if (groupName) {
            existingGroup.name = groupName;
        }

        if (panels) {
            existingGroup.panels = panels;
        }

        await store.write();
        return existingGroup;
    });

    app.put<{Body: GroupType, Reply: GroupType, Params: GroupPathParamsType}>('/groupName', {
        schema: {
            body: GroupSchema,
            params: GroupPathParamsSchema,
            response: {
                200: GroupSchema,
            }
        }
    },async (req, reply) => {
        const { groupName } = req.params;
        const { panels } = req.body;

        const existingGroup = store.data.groups.find(group => group.name === groupName);
        if (existingGroup === undefined) {
            reply.status(204);
            store.data.groups.push({ name: groupName, panels });
            return;
        }

        reply.status(200);
        existingGroup.name = groupName;
        existingGroup.panels = panels;

        await store.write();
        return existingGroup;
    });

    app.delete<{
        Params: GroupPathParamsType
    }>('/groupName', {
        schema: {
            params: GroupPathParamsSchema,
        }
    },async (req, reply) => {
        const { groupName } = req.params;

        const existingGroupIndex = store.data.groups.findIndex(group => group.name === groupName);
        if (existingGroupIndex === -1) {
            reply.status(404);
            return;
        }

        store.data.groups.splice(existingGroupIndex, 1);

        await store.write();
        reply.status(204);
    });

    app.register(panelsRouter, { prefix: '/panels' });
};

const PanelsPathParamsSchema = GroupPathParamsSchema;
type PanelsPathParamsType = Static<typeof PanelsPathParamsSchema>;
export const panelsRouter: FastifyPluginAsync = async (app: FastifyTypebox, opts) => {
    app.get<{Params: PanelsPathParamsType, Reply: PanelsType}>('/', {
        schema: {
            params: PanelsPathParamsSchema,
            response: {
                200: PanelsSchema
            }
        }
    }, async (req, reply) => {
        const { groupName } = req.params;

        const existingGroup = store.data.groups.find(group => group.name === groupName);
        if (existingGroup === undefined) {
            reply.status(404);
            return;
        }

        return existingGroup.panels;
    });

    app.post<{Params: PanelsPathParamsType, Body: PanelNameType, Reply: PanelsType}>('/', {
        schema: {
            params: PanelsPathParamsSchema,
            body: PanelNameSchema,
            response: {
                201: PanelNameSchema
            }
        }
    }, async (req, reply) => {
        const { groupName } = req.params;
        const newPanel = req.body;

        const existingGroup = store.data.groups.find(group => group.name === groupName);
        if (existingGroup === undefined) {
            reply.status(404);
            return;
        }

        const isPanelInGroup = existingGroup.panels.findIndex(panel => panel === newPanel);
        if (isPanelInGroup) {
            reply.status(409);
            return;
        }

        existingGroup.panels.push(newPanel);
        await store.write();
        return existingGroup.panels;
    });

    app.put<{Body: PanelsType, Params: PanelsPathParamsType, Reply: PanelsType}>('/', {
        schema: {
            body: PanelsSchema,
            params: PanelsPathParamsSchema,
            response: {
                200: PanelsSchema
            }
        }
    }, async (req, reply) => {
        const { groupName } = req.params;
        const newPanels = req.body;

        const existingGroup = store.data.groups.find(group => group.name === groupName);
        if (existingGroup === undefined) {
            reply.status(404);
            return;
        }

        existingGroup.panels = newPanels;
        await store.write();
        return existingGroup.panels;
    });

    app.register(panelRouter);
};

const PanelPathParamsSchema = Type.Composite([
    GroupPathParamsSchema,
    Type.Object({
        panelName: PanelNameSchema
    })
]);
type PanelPathParamsType = Static<typeof PanelPathParamsSchema>;
export const panelRouter: FastifyPluginAsync = async (app: FastifyTypebox, opts) => {
    app.put<{Params: PanelPathParamsType}>('/:panelName', {
        schema: {
            params: PanelPathParamsSchema
        }
    }, async (req, reply) => {
        const { groupName, panelName } = req.params;

        const existingGroup = store.data.groups.find(group => group.name === groupName);
        if (existingGroup === undefined) {
            reply.status(404);
            return;
        }

        const isPanelInGroup = existingGroup.panels.findIndex(panel => panel === panelName);
        if (isPanelInGroup) {
            reply.status(200);
            return;
        }

        existingGroup.panels.push(panelName);
        await store.write();
        reply.status(204);
    });

    app.delete<{Params: PanelPathParamsType}>('/:panelName', {
        schema: {
            params: PanelPathParamsSchema
        }
    }, async (req, reply) => {
        const { groupName, panelName } = req.params;

        const existingGroup = store.data.groups.find(group => group.name === groupName);
        if (existingGroup === undefined) {
            reply.status(404);
            return;
        }

        const panelIndexInGroup = existingGroup.panels.findIndex(panel => panel === panelName);
        if (panelIndexInGroup === -1) {
            reply.status(404);
            return;
        }

        existingGroup.panels.splice(panelIndexInGroup, 1);
        await store.write();
        reply.status(204);
    });
};