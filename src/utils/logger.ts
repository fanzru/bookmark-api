import pino from 'pino';
import { config } from './config';

const transport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
  },
});

const logger = pino(
  {
    level: config.logLevel,
    base: {
      env: config.nodeEnv,
    },
  },
  transport
);

export default logger;