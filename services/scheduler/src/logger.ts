import { pino } from 'pino';
import { LOG_LEVEL } from './environment.js';

export const logger = pino({
	level: LOG_LEVEL,
});
