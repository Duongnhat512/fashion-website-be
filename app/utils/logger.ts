import winston from 'winston';
import { config } from '../config/env';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which transports the logger must use
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
      ),
    ),
  }),
];

// Only add file transports in production
if (config.nodeEnv === 'production') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: './logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: './logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  );
}

// Create the logger
const logger = winston.createLogger({
  level: config.nodeEnv === 'development' ? 'debug' : 'warn',
  levels,
  transports,
  exitOnError: false,
});

// Security event logger - Create transports array properly
const securityTransports: winston.transport[] = [
  new winston.transports.File({
    filename: './logs/security.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
  }),
];

// Add console transport in development
if (config.nodeEnv === 'development') {
  securityTransports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
        winston.format.colorize({ all: true }),
        winston.format.printf(
          (info) =>
            `[SECURITY] ${info.timestamp} ${info.level}: ${info.message}`,
        ),
      ),
    }),
  );
}

export const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: securityTransports,
});

export default logger;
