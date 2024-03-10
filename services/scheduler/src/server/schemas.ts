import { Type } from '@fastify/type-provider-typebox';

export const HttpErrorSchema = Type.Ref('HttpError');

export const EmptyBodySchema = Type.Null();

export const EInkJobSchema = Type.Object({
	id: Type.Integer(),
	name: Type.String(),
	description: Type.Union([Type.String(), Type.Null()]),
	cron: Type.String(),
	target: Type.String(),
	command: Type.String(),
	content: Type.Array(Type.String()),
	precise: Type.Boolean(),
	priority: Type.Integer(),
	cycle: Type.Integer(),
	shouldCycle: Type.Boolean(),
	disabled: Type.Boolean(),
});

export const EInkJobSelectableSchema = EInkJobSchema;

export const EInkJobUpdatableSchema = Type.Partial(
	Type.Pick(EInkJobSchema, [
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
	]),
);
export const EInkJobBulkUpdatableSchema = Type.Array(
	Type.Intersect([Type.Pick(EInkJobSchema, ['id']), EInkJobUpdatableSchema]),
);

export const EInkJobInsertableSchema = Type.Intersect([
	Type.Pick(EInkJobSchema, ['name', 'cron', 'target', 'command']),
	Type.Partial(
		Type.Pick(EInkJobSchema, ['description', 'content', 'priority', 'shouldCycle', 'disabled']),
	),
]);

export const EInkJobQuerySchema = Type.Partial(
	Type.Pick(EInkJobSchema, ['target', 'precise', 'disabled']),
);

export const EInkJobParamsSchema = Type.Object({
	id: Type.Integer(),
});
