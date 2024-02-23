import { Type } from '@fastify/type-provider-typebox';
import { Role, Scope } from './database.js';
export const Nullable = (schema) => Type.Unsafe({
    ...schema,
    nullable: true,
});
export const EmptyBodySchema = Type.Null();
export const HttpErrorSchema = Type.Ref('HttpError');
export const RoleSchema = Type.Enum(Role);
export const ScopeSchema = Type.Enum(Scope);
export const UserSchema = Type.Object({
    id: Type.Number(),
    username: Type.String(),
    role: RoleSchema,
    groups: Type.Array(Type.Object({ id: Type.Number(), name: Nullable(Type.String()) })),
});
export const InsertableUserSchema = Type.Object({
    username: Type.String(),
    role: Type.Optional(RoleSchema),
    password: Type.String(),
});
export const UpdatableUserSchema = Type.Partial(InsertableUserSchema);
export const PanelGroupSchema = Type.Object({
    id: Type.String(),
    name: Nullable(Type.String()),
});
export const InsertablePanelGroupSchema = Type.Object({
    id: Type.String(),
    name: Type.Partial(Nullable(Type.String())),
});
export const UserGroupSchema = Type.Object({
    id: Type.Number(),
    name: Type.String(),
    scopes: Type.Array(ScopeSchema),
    users: Type.Array(Type.Omit(UserSchema, ['groups'])),
    managedPanelGroups: Type.Array(PanelGroupSchema),
});
export const InsertableUserGroupSchema = Type.Object({
    name: Type.String(),
    scopes: Type.Optional(Type.Array(ScopeSchema)),
    users: Type.Optional(Type.Array(Type.Pick(UserSchema, ['id']))),
    managedPanelGroups: Type.Optional(Type.Array(Type.Pick(PanelGroupSchema, ['id']))),
});
export const UpdatableUserGroupSchema = Type.Partial(InsertableUserGroupSchema);
export const GenericObjectWithId = Type.Object({
    id: Type.String(),
});
//# sourceMappingURL=schemas.js.map