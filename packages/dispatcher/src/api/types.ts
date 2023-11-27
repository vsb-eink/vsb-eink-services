import {
    FastifyBaseLogger,
    FastifyInstance,
    RawReplyDefaultExpression,
    RawRequestDefaultExpression,
    RawServerDefault
} from "fastify";
import {TypeBoxTypeProvider} from "@fastify/type-provider-typebox";

export type FastifyTypebox = FastifyInstance<
    RawServerDefault,
    RawRequestDefaultExpression<RawServerDefault>,
    RawReplyDefaultExpression<RawServerDefault>,
    FastifyBaseLogger,
    TypeBoxTypeProvider
>;