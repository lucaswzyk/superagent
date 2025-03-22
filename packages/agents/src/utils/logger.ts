import winston from 'winston';
import { format } from 'winston';

const { combine, timestamp, printf, colorize } = format;

const customFormat = printf((info: winston.Logform.TransformableInfo) => {
  const { timestamp, level, message, ...metadata } = info;
  let msg = `${timestamp} [${level}] ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    colorize(),
    customFormat
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Create a stream object for Morgan
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
}; 