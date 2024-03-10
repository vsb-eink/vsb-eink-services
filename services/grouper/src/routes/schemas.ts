import { Static, TSchema, Type } from '@fastify/type-provider-typebox';

export const Nullable = <T extends TSchema>(schema: T) =>
	Type.Unsafe<Static<T> | null>({
		...schema,
		nullable: true,
	});

export const GenericObjectWithIdAndOptionalName = Type.Object({
	id: Type.String(),
	name: Type.Optional(Nullable(Type.String())),
});

export const GenericObjectWithIdAndNullableName = Type.Object({
	id: Type.String(),
	name: Nullable(Type.String()),
});

export const GroupSchema = Type.Intersect([
	GenericObjectWithIdAndNullableName,
	Type.Object({
		panels: Type.Array(GenericObjectWithIdAndNullableName),
	}),
]);

export const InsertableGroupSchema = Type.Intersect([
	GenericObjectWithIdAndOptionalName,
	Type.Object({
		panels: Type.Optional(Type.Array(GenericObjectWithIdAndOptionalName)),
	}),
]);

export const UpdatableGroupSchema = Type.Partial(InsertableGroupSchema);

export const PanelSchema = Type.Intersect([
	GenericObjectWithIdAndNullableName,
	Type.Object({
		groups: Type.Array(GenericObjectWithIdAndNullableName),
	}),
]);

export const InsertablePanelSchema = Type.Intersect([
	GenericObjectWithIdAndOptionalName,
	Type.Object({
		groups: Type.Array(GenericObjectWithIdAndOptionalName),
	}),
]);

export const UpdatablePanelSchema = Type.Partial(InsertablePanelSchema);

export const HttpErrorSchema = Type.Ref('HttpError');

export const EmptyBodySchema = Type.Null();
