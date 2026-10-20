type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function configuredLevel(): number {
  const fromEnv = process.env.NEXT_PUBLIC_LOG_LEVEL || process.env.LOG_LEVEL;
  if (fromEnv && fromEnv in ORDER) return ORDER[fromEnv as LogLevel];
  return process.env.NODE_ENV === 'production' ? ORDER.warn : ORDER.debug;
}

function emit(level: LogLevel, args: unknown[]) {
  if (ORDER[level] < configuredLevel()) return;
  const method = level === 'debug' ? 'log' : level;
  (console[method] as (...values: unknown[]) => void)(`[${level}]`, ...args);
}

export const logger = {
  debug: (...args: unknown[]) => emit('debug', args),
  info: (...args: unknown[]) => emit('info', args),
  warn: (...args: unknown[]) => emit('warn', args),
  error: (...args: unknown[]) => emit('error', args),
};
