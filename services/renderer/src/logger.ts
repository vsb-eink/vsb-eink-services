import { createLogger, transports, format } from 'winston';

export const logger = createLogger({
	format: format.cli(),
	transports: [new transports.Console()],
});
