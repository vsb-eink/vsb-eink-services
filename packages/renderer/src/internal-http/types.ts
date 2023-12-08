import {
	FastifyInstance,
	FastifyBaseLogger,
	RawReplyDefaultExpression,
	RawRequestDefaultExpression,
	RawServerDefault,
} from 'fastify';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';

export type TypedFastifyInstance = FastifyInstance<
	RawServerDefault,
	RawRequestDefaultExpression<RawServerDefault>,
	RawReplyDefaultExpression<RawServerDefault>,
	FastifyBaseLogger,
	JsonSchemaToTsProvider
>;
