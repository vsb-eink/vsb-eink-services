import { default as env } from 'env-var';

export const BROKER_HOST = env
    .get('BROKER_HOST')
    .default('localhost')
    .asString();

export const API_HOST = env.get('API_HOST').default('127.0.0.1').asString();
export const API_PORT = env.get('API_PORT').default(3000).asPortNumber();

