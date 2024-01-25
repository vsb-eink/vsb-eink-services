import { Type } from '@fastify/type-provider-typebox';

export const PanelNameSchema = Type.String();

export const GroupNameSchema = Type.String();

export const GroupSchema = Type.Object({
	name: GroupNameSchema,
	panels: Type.Array(PanelNameSchema),
});

export const UpdatableGroupSchema = Type.Partial(GroupSchema);

export const GroupsSchema = Type.Array(GroupSchema);

export const PanelsSchema = Type.Array(PanelNameSchema);

export const HttpErrorSchema = Type.Ref('HttpError');

export const VoidSchema = Type.Null();
