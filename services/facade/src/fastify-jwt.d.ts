import '@fastify/jwt';
import { Role, Scope } from './database.js';

interface TokenPayload {
	id: number;
	role: Role;
}

interface UserPayload {
	id: number;
	username: string;
	role: Role;
	scopes: Scope[];
}

declare module '@fastify/jwt' {
	export interface FastifyJWT {
		payload: TokenPayload;
		user: UserPayload;
	}
}
