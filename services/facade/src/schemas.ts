import { Type } from '@fastify/type-provider-typebox';
import { Role, Scope } from './database.js';

export const EmptyBodySchema = Type.Null();
export const HttpErrorSchema = Type.Ref('HttpError');

export const GenericObjectWithStringIdAndOptionalName = Type.Object({
	id: Type.String(),
	name: Type.Optional(Type.String()),
});

export const GenericObjectWithNumericIdAndOptionalName = Type.Object({
	id: Type.Number(),
	name: Type.Optional(Type.String()),
});

export const GenericObjectWithNumericIdAndName = Type.Object({
	id: Type.Number(),
	name: Type.String(),
});

export const GenericObjectWithStringIdAndName = Type.Object({
	id: Type.String(),
	name: Type.String(),
});

export const RoleSchema = Type.Enum(Role);
export const ScopeSchema = Type.Enum(Scope);

export const UserSchema = Type.Object({
	id: Type.Number(),
	username: Type.String(),
	role: RoleSchema,
	groups: Type.Array(GenericObjectWithNumericIdAndName),
});

export const InsertableUserSchema = Type.Object({
	username: Type.String(),
	role: Type.Optional(RoleSchema),
	password: Type.String(),
	groups: Type.Optional(Type.Array(GenericObjectWithNumericIdAndOptionalName)),
});

export const UpdatableUserSchema = Type.Partial(InsertableUserSchema);

export const PanelGroupSchema = Type.Intersect([
	GenericObjectWithStringIdAndName,
	Type.Object({
		panels: Type.Array(GenericObjectWithStringIdAndName),
		managedBy: Type.Array(GenericObjectWithNumericIdAndName),
	}),
]);

export const InsertablePanelGroupSchema = Type.Intersect([
	GenericObjectWithStringIdAndOptionalName,
	Type.Object({
		panels: Type.Optional(Type.Array(GenericObjectWithStringIdAndOptionalName)),
		managedBy: Type.Optional(Type.Array(GenericObjectWithNumericIdAndOptionalName)),
	}),
]);

export const UpdatablePanelGroupSchema = Type.Partial(InsertablePanelGroupSchema);

export const PanelSchema = Type.Intersect([
	GenericObjectWithStringIdAndName,
	Type.Object({
		groups: Type.Array(GenericObjectWithStringIdAndName),
	}),
]);

export const InsertablePanelSchema = Type.Intersect([
	GenericObjectWithStringIdAndOptionalName,
	Type.Object({
		groups: Type.Optional(Type.Array(GenericObjectWithStringIdAndOptionalName)),
	}),
]);

export const UpdatablePanelSchema = Type.Partial(InsertablePanelSchema);

export const UserGroupSchema = Type.Object({
	id: Type.Number(),
	name: Type.String(),
	scopes: Type.Array(ScopeSchema),
	users: Type.Array(Type.Omit(UserSchema, ['groups'])),
	managedPanelGroups: Type.Array(GenericObjectWithStringIdAndName),
});

export const InsertableUserGroupSchema = Type.Object({
	name: Type.String(),
	scopes: Type.Optional(Type.Array(ScopeSchema)),
	users: Type.Optional(Type.Array(Type.Pick(UserSchema, ['id']))),
	managedPanelGroups: Type.Optional(Type.Array(GenericObjectWithStringIdAndOptionalName)),
});

export const UpdatableUserGroupSchema = Type.Partial(InsertableUserGroupSchema);
