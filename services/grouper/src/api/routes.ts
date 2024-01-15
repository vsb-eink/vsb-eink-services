import { FastifyPluginAsyncTypebox, Static, Type } from '@fastify/type-provider-typebox';

import {
	GroupNameSchema,
	GroupSchema,
	GroupsSchema,
	UpdatableGroupSchema,
	PanelNameSchema,
	PanelsSchema,
	HttpErrorSchema,
	VoidSchema,
} from '../schemas.js';
import { store } from '../store.js';

export const groupsRouter: FastifyPluginAsyncTypebox = async (app, opts) => {
	app.get(
		'/',
		{
			schema: {
				response: {
					200: GroupsSchema,
				},
			},
		},
		async (req, reply) => {
			return store.data.groups;
		},
	);

	app.post(
		'/',
		{
			schema: {
				body: GroupSchema,
				response: {
					201: GroupSchema,
					409: HttpErrorSchema,
				},
			},
		},
		async (req, reply) => {
			const { name, panels } = req.body;

			const existingGroup = store.data.groups.find((group) => group.name === name);
			if (existingGroup !== undefined) {
				return reply.conflict();
			}

			store.data.groups.push({ name, panels });
			await store.write();

			reply.status(201);
			return { name, panels };
		},
	);

	app.put(
		'/',
		{
			schema: {
				body: GroupsSchema,
				response: {
					200: GroupsSchema,
				},
			},
		},
		async (req, reply) => {
			const groups = req.body;
			store.data.groups = groups;
			await store.write();
			return store.data.groups;
		},
	);

	app.register(groupRouter);
};

const GroupPathParamsSchema = Type.Object({
	groupName: GroupNameSchema,
});
export const groupRouter: FastifyPluginAsyncTypebox = async (app, opts) => {
	app.get(
		'/:groupName',
		{
			schema: {
				params: GroupPathParamsSchema,
				response: {
					200: GroupSchema,
					404: HttpErrorSchema,
				},
			},
		},
		async (req, reply) => {
			const { groupName } = req.params;

			const existingGroup = store.data.groups.find((group) => group.name === groupName);
			if (existingGroup === undefined) {
				return reply.notFound();
			}

			return existingGroup;
		},
	);

	app.patch(
		'/:groupName',
		{
			schema: {
				body: UpdatableGroupSchema,
				params: GroupPathParamsSchema,
				response: {
					200: GroupSchema,
					404: HttpErrorSchema,
				},
			},
		},
		async (req, reply) => {
			const { groupName } = req.params;
			const { panels } = req.body;

			const existingGroup = store.data.groups.find((group) => group.name === groupName);
			if (existingGroup === undefined) {
				return reply.notFound();
			}

			if (groupName) {
				existingGroup.name = groupName;
			}

			if (panels) {
				existingGroup.panels = panels;
			}

			await store.write();
			return existingGroup;
		},
	);

	app.put(
		'/:groupName',
		{
			schema: {
				body: GroupSchema,
				params: GroupPathParamsSchema,
				response: {
					200: GroupSchema,
					204: VoidSchema,
				},
			},
		},
		async (req, reply) => {
			const { groupName } = req.params;
			const { panels } = req.body;

			const existingGroup = store.data.groups.find((group) => group.name === groupName);
			if (existingGroup === undefined) {
				store.data.groups.push({ name: groupName, panels });
				return reply.status(204);
			}

			existingGroup.name = groupName;
			existingGroup.panels = panels;

			await store.write();
			return existingGroup;
		},
	);

	app.delete(
		'/:groupName',
		{
			schema: {
				params: GroupPathParamsSchema,
				response: {
					204: VoidSchema,
					404: HttpErrorSchema,
				},
			},
		},
		async (req, reply) => {
			const { groupName } = req.params;

			const existingGroupIndex = store.data.groups.findIndex(
				(group) => group.name === groupName,
			);
			if (existingGroupIndex === -1) {
				return reply.notFound();
			}

			store.data.groups.splice(existingGroupIndex, 1);

			await store.write();
			return reply.status(204);
		},
	);

	app.register(panelsRouter, { prefix: '/panels' });
};

const PanelsPathParamsSchema = GroupPathParamsSchema;
export const panelsRouter: FastifyPluginAsyncTypebox = async (app, opts) => {
	app.get(
		'/',
		{
			schema: {
				params: PanelsPathParamsSchema,
				response: {
					200: PanelsSchema,
					404: HttpErrorSchema,
				},
			},
		},
		async (req, reply) => {
			const { groupName } = req.params;

			const existingGroup = store.data.groups.find((group) => group.name === groupName);
			if (existingGroup === undefined) {
				return reply.notFound();
			}

			return existingGroup.panels;
		},
	);

	app.post(
		'/',
		{
			schema: {
				params: PanelsPathParamsSchema,
				body: PanelNameSchema,
				response: {
					201: PanelsSchema,
					404: HttpErrorSchema,
				},
			},
		},
		async (req, reply) => {
			const { groupName } = req.params;
			const newPanel = req.body;

			const existingGroup = store.data.groups.find((group) => group.name === groupName);
			if (existingGroup === undefined) {
				return reply.notFound();
			}

			const isPanelInGroup = existingGroup.panels.findIndex((panel) => panel === newPanel);
			if (isPanelInGroup) {
				return reply.status(409);
			}

			existingGroup.panels.push(newPanel);
			await store.write();
			return existingGroup.panels;
		},
	);

	app.put(
		'/',
		{
			schema: {
				body: PanelsSchema,
				params: PanelsPathParamsSchema,
				response: {
					200: PanelsSchema,
					404: HttpErrorSchema,
				},
			},
		},
		async (req, reply) => {
			const { groupName } = req.params;
			const newPanels = req.body;

			const existingGroup = store.data.groups.find((group) => group.name === groupName);
			if (existingGroup === undefined) {
				return reply.notFound();
			}

			existingGroup.panels = newPanels;
			await store.write();
			return existingGroup.panels;
		},
	);

	app.register(panelRouter);
};

const PanelPathParamsSchema = Type.Composite([
	GroupPathParamsSchema,
	Type.Object({
		panelName: PanelNameSchema,
	}),
]);
type PanelPathParamsType = Static<typeof PanelPathParamsSchema>;
export const panelRouter: FastifyPluginAsyncTypebox = async (app, opts) => {
	app.put(
		'/:panelName',
		{
			schema: {
				params: PanelPathParamsSchema,
				response: {
					200: VoidSchema,
					204: VoidSchema,
					404: HttpErrorSchema,
				},
			},
		},
		async (req, reply) => {
			const { groupName, panelName } = req.params;

			const existingGroup = store.data.groups.find((group) => group.name === groupName);
			if (existingGroup === undefined) {
				return reply.notFound();
			}

			const isPanelInGroup = existingGroup.panels.findIndex((panel) => panel === panelName);
			if (isPanelInGroup) {
				return;
			}

			existingGroup.panels.push(panelName);
			await store.write();
			return reply.status(204);
		},
	);

	app.delete(
		'/:panelName',
		{
			schema: {
				params: PanelPathParamsSchema,
				response: {
					204: VoidSchema,
					404: HttpErrorSchema,
				},
			},
		},
		async (req, reply) => {
			const { groupName, panelName } = req.params;

			const existingGroup = store.data.groups.find((group) => group.name === groupName);
			if (existingGroup === undefined) {
				return reply.notFound();
			}

			const panelIndexInGroup = existingGroup.panels.findIndex(
				(panel) => panel === panelName,
			);
			if (panelIndexInGroup === -1) {
				return reply.notFound();
			}

			existingGroup.panels.splice(panelIndexInGroup, 1);
			await store.write();
			return reply.status(204);
		},
	);
};
