import { Type } from '@fastify/type-provider-typebox';

export const HttpErrorSchema = Type.Ref('HttpError');

export const EmptyBodySchema = Type.Null();

export const EInkJobSchema = Type.Object({
	id: Type.Integer(),
	name: Type.Union([Type.String(), Type.Null()]),
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

export const EInkJobSelectableSchema = EInkJobSchema;

export const EInkJobUpdatableSchema = Type.Partial(EInkJobSchema);

export const EInkJobInsertableSchema = Type.Intersect([
	Type.Pick(EInkJobSchema, ['cron', 'target', 'command', 'commandType']),
	Type.Partial(
		Type.Pick(EInkJobSchema, [
			'name',
			'commandArgs',
			'hasSeconds',
			'priority',
			'cycle',
			'shouldCycle',
			'disabled',
		]),
	),
]);

export const EInkJobQuerySchema = Type.Partial(
	Type.Pick(EInkJobSchema, ['target', 'hasSeconds', 'disabled']),
);

export const EInkJobParamsSchema = Type.Object({
	id: Type.Integer(),
});
