import env from 'env-var';

export const CONTENT_PATH = env.get('CONTENT_PATH').default('public').asString();
export const CORE_CONTENT_DIRNAME = env.get('CORE_CONTENT_DIRNAME').default('core').asString();
export const USER_CONTENT_DIRNAME = env.get('CORE_CONTENT_DIRNAME').default('user').asString();

export const API_HOST = env.get('API_HOST').default('0.0.0.0').asString();
export const API_PORT = env.get('API_PORT').default(3000).asPortNumber();
