import { pino } from 'pino';
import { LOG_LEVEL } from './env.js';

export const logger = pino({
	level: LOG_LEVEL,
});
