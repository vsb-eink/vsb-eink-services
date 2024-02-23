import { Type } from '@fastify/type-provider-typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { db } from '../database.js';
const AccessTokenPayload = Type.Object({
    id: Type.Number(),
    iat: Type.Number(),
    exp: Type.Number(),
});
const AccessTokenPayloadCompiler = TypeCompiler.Compile(AccessTokenPayload);
export const verifyJWT = async (request, reply) => {
    try {
        const token = await request.jwtVerify();
        if (!AccessTokenPayloadCompiler.Check(token)) {
            return reply.unauthorized();
        }
        const user = await db.user.findUnique({
            where: { id: token.id },
            include: { groups: { select: { scopes: true } } },
        });
        if (!user) {
            return reply.unauthorized();
        }
        const scopes = new Set(user.groups.flatMap((group) => group.scopes));
        request.user = request.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            scopes: [...scopes],
        };
    }
    catch (err) {
        request.log.error(err);
        return reply.unauthorized();
    }
};
//# sourceMappingURL=jwt.js.map