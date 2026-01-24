/**
 * Global Logger Utility
 * Only logs in development mode - silent in production
 */

const isDev = process.env.NODE_ENV === 'development';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface Logger {
  log: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

const noop = () => {};

const createLogger = (): Logger => {
  if (!isDev) {
    return {
      log: noop,
      info: noop,
      warn: noop,
      error: noop,
      debug: noop,
    };
  }

  return {
    log: (...args: unknown[]) => console.log('[DEV]', ...args),
    info: (...args: unknown[]) => console.info('[DEV]', ...args),
    warn: (...args: unknown[]) => console.warn('[DEV]', ...args),
    error: (...args: unknown[]) => console.error('[DEV]', ...args),
    debug: (...args: unknown[]) => console.debug('[DEV]', ...args),
  };
};

export const logger = createLogger();

// Prefixed loggers for specific modules
export const createPrefixedLogger = (prefix: string): Logger => {
  if (!isDev) {
    return {
      log: noop,
      info: noop,
      warn: noop,
      error: noop,
      debug: noop,
    };
  }

  return {
    log: (...args: unknown[]) => console.log(`[DEV][${prefix}]`, ...args),
    info: (...args: unknown[]) => console.info(`[DEV][${prefix}]`, ...args),
    warn: (...args: unknown[]) => console.warn(`[DEV][${prefix}]`, ...args),
    error: (...args: unknown[]) => console.error(`[DEV][${prefix}]`, ...args),
    debug: (...args: unknown[]) => console.debug(`[DEV][${prefix}]`, ...args),
  };
};

// Pre-configured loggers for common modules
export const securityLogger = createPrefixedLogger('SECURITY');
export const authLogger = createPrefixedLogger('AUTH');
export const paymentLogger = createPrefixedLogger('PAYMENT');
export const apiLogger = createPrefixedLogger('API');
