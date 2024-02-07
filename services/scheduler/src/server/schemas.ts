import { Omit, TSchema, Type } from '@fastify/type-provider-typebox';

const Nullable = <T extends TSchema>(schema: T) => Type.Union([schema, Type.Null()]);

export const HttpErrorSchema = Type.Ref('HttpError');

export const EmptyBodySchema = Type.Null();

export const EInkJobSchema = Type.Object({
	id: Type.Integer(),
	name: Nullable(Type.String()),
	cron: Type.String(),
	target: Type.String(),
	command: Type.String(),
	commandType: Type.String(),
	commandArgs: Type.Array(Type.String()),
	hasSeconds: Type.Boolean(),
	priority: Type.Integer(),
	cycle: Type.Integer(),
	shouldCycle: Type.Boolean(),
	disabled: Type.Boolean(),
});

export const EInkJobSelectableSchema = Type.Composite([EInkJobSchema]);

export const EInkJobUpdatableSchema = Type.Partial(
	Type.Composite([Type.Omit(EInkJobSchema, ['name']), Type.Object({ name: Type.String() })]),
);

export const EInkJobCreatableSchema = Type.Composite([
	Omit(EInkJobSchema, ['id', 'name']),
	Type.Object({
		name: Type.String(),
		hasSeconds: Type.Partial(Type.Boolean()),
		priority: Type.Partial(Type.Integer()),
		disabled: Type.Partial(Type.Boolean()),
	}),
]);

export const EInkJobQuerySchema = Type.Partial(
	Type.Pick(EInkJobSchema, ['target', 'hasSeconds', 'disabled']),
);

export const EInkJobParamsSchema = Type.Object({
	id: Type.Integer(),
});
