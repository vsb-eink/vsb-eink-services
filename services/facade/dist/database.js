import { PrismaClient, Prisma } from '@prisma/facade-client';
export * from '@prisma/facade-client';
export const db = new PrismaClient();
export function isDatabaseError(error) {
    return error instanceof Prisma.PrismaClientKnownRequestError;
}
export function isNotFoundError(error) {
    return isDatabaseError(error) && error.code === 'P2025';
}
//# sourceMappingURL=database.js.map