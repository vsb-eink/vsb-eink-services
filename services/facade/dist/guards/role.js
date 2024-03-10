export const verifyRole = (role) => {
    return async (request, reply) => {
        if (request.user.role !== role) {
            return reply.forbidden();
        }
    };
};
//# sourceMappingURL=role.js.map