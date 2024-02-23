import env from 'env-var';

export const USER_CONTENT_PATH = env.get('USER_CONTENT_PATH').default('public').asString();

export const API_HOST = env.get('API_HOST').default('0.0.0.0').asString();
export const API_PORT = env.get('API_PORT').default(3000).asPortNumber();
