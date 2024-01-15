import { Type } from '@fastify/type-provider-typebox';

export const HttpErrorSchema = Type.Ref('HttpError');

export const EmptyBodySchema = Type.Null();
