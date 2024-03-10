export const verifyScope = (...scopes) => {
    return async (request, reply) => {
        if (scopes.length === 0) {
            throw new Error('verifyScope needs at least one scope!');
        }
        if (!request.user.scopes.some((scope) => scopes.includes(scope))) {
            return reply.forbidden();
        }
    };
};
//# sourceMappingURL=scope.js.map