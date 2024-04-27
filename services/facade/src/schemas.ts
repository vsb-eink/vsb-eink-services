import { Type } from '@fastify/type-provider-typebox';
import { Role, Scope } from './database.js';
import { FastifyInstance } from 'fastify';

export const EmptyBodySchema = Type.Null({ $id: 'EmptyBody' });
export const HttpErrorSchema = Type.Ref('HttpError');
export const IdentifierStringSchema = Type.String({ pattern: '^[a-zA-Z0-9_\\-.]+$' });

export const LinkablePanelSchema = Type.Object(
	{
		id: IdentifierStringSchema,
		name: Type.Optional(Type.String()),
	},
	{ $id: 'LinkablePanel' },
);
export const LinkedPanelSchema = Type.Object(
	{
		id: IdentifierStringSchema,
		name: Type.String(),
	},
	{ $id: 'LinkedPanel' },
);

export const LinkablePanelGroupSchema = Type.Object(
	{
		id: IdentifierStringSchema,
		name: Type.Optional(Type.String()),
	},
	{ $id: 'LinkablePanelGroup' },
);
export const LinkedPanelGroupSchema = Type.Object(
	{
		id: IdentifierStringSchema,
		name: Type.String(),
	},
	{ $id: 'LinkedPanelGroup' },
);

export const LinkableUserSchema = Type.Object(
	{
		id: Type.Number(),
		username: Type.Optional(IdentifierStringSchema),
	},
	{ $id: 'LinkableUser' },
);
export const LinkedUserSchema = Type.Object(
	{
		id: Type.Number(),
		username: IdentifierStringSchema,
	},
	{ $id: 'LinkedUser' },
);

export const LinkableUserGroupSchema = Type.Object(
	{
		id: Type.Number(),
		name: Type.Optional(Type.String()),
	},
	{ $id: 'LinkableUserGroup' },
);
export const LinkedUserGroupSchema = Type.Object(
	{
		id: Type.Number(),
		name: Type.String(),
	},
	{ $id: 'LinkedUserGroup' },
);

export const RoleSchema = Type.Enum(Role, { $id: 'Role' });
export const ScopeSchema = Type.Enum(Scope, { $id: 'Scope' });

export const UserSchema = Type.Object(
	{
		id: Type.Number(),
		username: IdentifierStringSchema,
		role: Type.Ref(RoleSchema),
		groups: Type.Array(Type.Ref(LinkedUserGroupSchema)),
	},
	{ $id: 'User' },
);

export const InsertableUserSchema = Type.Object(
	{
		username: IdentifierStringSchema,
		role: Type.Optional(Type.Ref(RoleSchema)),
		password: Type.String(),
		groups: Type.Optional(Type.Array(Type.Ref(LinkableUserGroupSchema))),
	},
	{ $id: 'InsertableUser' },
);

export const UpdatableUserSchema = Type.Object(
	{
		username: Type.Optional(IdentifierStringSchema),
		role: Type.Optional(Type.Ref(RoleSchema)),
		password: Type.Optional(Type.String()),
		groups: Type.Optional(Type.Array(Type.Ref(LinkableUserGroupSchema))),
	},
	{ $id: 'UpdatableUser' },
);

export const PanelGroupSchema = Type.Object(
	{
		id: IdentifierStringSchema,
		name: Type.String(),
		panels: Type.Array(Type.Ref(LinkedPanelSchema)),
		managedBy: Type.Array(Type.Ref(LinkedUserGroupSchema)),
	},
	{ $id: 'PanelGroup' },
);

export const InsertablePanelGroupSchema = Type.Object(
	{
		id: IdentifierStringSchema,
		name: Type.Optional(Type.String()),
		panels: Type.Optional(Type.Array(Type.Ref(LinkablePanelSchema))),
		managedBy: Type.Optional(Type.Array(Type.Ref(LinkableUserGroupSchema))),
	},
	{ $id: 'InsertablePanelGroup' },
);

export const UpdatablePanelGroupSchema = Type.Object(
	{
		id: Type.Optional(IdentifierStringSchema),
		name: Type.Optional(Type.String()),
		panels: Type.Optional(Type.Array(Type.Ref(LinkablePanelSchema))),
		managedBy: Type.Optional(Type.Array(Type.Ref(LinkableUserGroupSchema))),
	},
	{ $id: 'UpdatablePanelGroup' },
);

export const PanelSchema = Type.Object(
	{
		id: IdentifierStringSchema,
		name: Type.String(),
		groups: Type.Array(Type.Ref(LinkedPanelGroupSchema)),
	},
	{ $id: 'Panel' },
);

export const InsertablePanelSchema = Type.Object(
	{
		id: IdentifierStringSchema,
		name: Type.Optional(Type.String()),
		groups: Type.Optional(Type.Array(Type.Ref(LinkablePanelGroupSchema))),
	},
	{ $id: 'InsertablePanel' },
);

export const UpdatablePanelSchema = Type.Object(
	{
		id: Type.Optional(IdentifierStringSchema),
		name: Type.Optional(Type.String()),
		groups: Type.Optional(Type.Array(Type.Ref(LinkablePanelGroupSchema))),
	},
	{ $id: 'UpdatablePanel' },
);

export const UserGroupSchema = Type.Object(
	{
		id: Type.Number(),
		name: Type.String(),
		scopes: Type.Array(Type.Ref(ScopeSchema)),
		users: Type.Array(Type.Ref(LinkedUserSchema)),
		managedPanelGroups: Type.Array(Type.Ref(LinkedPanelGroupSchema)),
	},
	{ $id: 'UserGroup' },
);

export const InsertableUserGroupSchema = Type.Object(
	{
		name: Type.String(),
		scopes: Type.Optional(Type.Array(Type.Ref(ScopeSchema))),
		users: Type.Optional(Type.Array(Type.Ref(LinkableUserSchema))),
		managedPanelGroups: Type.Optional(Type.Array(Type.Ref(LinkablePanelGroupSchema))),
	},
	{ $id: 'InsertableUserGroup' },
);

export const UpdatableUserGroupSchema = Type.Object(
	{
		name: Type.Optional(Type.String()),
		scopes: Type.Optional(Type.Array(Type.Ref(ScopeSchema))),
		users: Type.Optional(Type.Array(Type.Ref(LinkableUserSchema))),
		managedPanelGroups: Type.Optional(Type.Array(Type.Ref(LinkablePanelGroupSchema))),
	},
	{ $id: 'UpdatableUserGroup' },
);

export const ScheduledJobSchema = Type.Object(
	{
		id: Type.Integer(),
		name: Type.String(),
		description: Type.Union([Type.String(), Type.Null()]),
		cron: Type.String(),
		target: IdentifierStringSchema,
		command: Type.String(),
		content: Type.Array(Type.String()),
		precise: Type.Boolean(),
		priority: Type.Integer(),
		cycle: Type.Integer(),
		shouldCycle: Type.Boolean(),
		disabled: Type.Boolean(),
		oneShot: Type.Boolean()
	},
	{ $id: 'ScheduledJob' },
);

export const UpdatableScheduledJobSchema = Type.Partial(
	Type.Pick(ScheduledJobSchema, [
		'name',
		'description',
		'cron',
		'target',
		'command',
		'content',
		'priority',
		'cycle',
		'shouldCycle',
		'disabled',
		'oneShot'
	]),
	{ $id: 'UpdatableScheduledJob' },
);
export const BulkUpdatableScheduledJobSchema = Type.Intersect(
	[Type.Pick(ScheduledJobSchema, ['id']), Type.Ref(UpdatableScheduledJobSchema)],
	{ $id: 'BulkUpdatableScheduledJob' },
);

export const InsertableScheduledJobSchema = Type.Intersect(
	[
		Type.Pick(ScheduledJobSchema, ['name', 'cron', 'target', 'command']),
		Type.Partial(
			Type.Pick(ScheduledJobSchema, [
				'description',
				'content',
				'priority',
				'shouldCycle',
				'disabled',
				'oneShot'
			]),
		),
	],
	{ $id: 'ScheduledJobInsertable' },
);

export const registerCustomSchemas = (fastify: FastifyInstance) => {
	fastify
		.addSchema(EmptyBodySchema)
		.addSchema(LinkablePanelSchema)
		.addSchema(LinkedPanelSchema)
		.addSchema(LinkablePanelGroupSchema)
		.addSchema(LinkedPanelGroupSchema)
		.addSchema(LinkableUserSchema)
		.addSchema(LinkedUserSchema)
		.addSchema(LinkableUserGroupSchema)
		.addSchema(LinkedUserGroupSchema)
		.addSchema(RoleSchema)
		.addSchema(ScopeSchema)
		.addSchema(UserSchema)
		.addSchema(InsertableUserSchema)
		.addSchema(UpdatableUserSchema)
		.addSchema(PanelGroupSchema)
		.addSchema(InsertablePanelGroupSchema)
		.addSchema(UpdatablePanelGroupSchema)
		.addSchema(PanelSchema)
		.addSchema(InsertablePanelSchema)
		.addSchema(UpdatablePanelSchema)
		.addSchema(UserGroupSchema)
		.addSchema(InsertableUserGroupSchema)
		.addSchema(UpdatableUserGroupSchema)
		.addSchema(ScheduledJobSchema)
		.addSchema(UpdatableScheduledJobSchema)
		.addSchema(BulkUpdatableScheduledJobSchema)
		.addSchema(InsertableScheduledJobSchema);
};
