export const LOG_LEVEL = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
} as const;

export type LogLevel = typeof LOG_LEVEL[keyof typeof LOG_LEVEL] | string;

export function log(
  level: LogLevel,
  component: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    component,
    message,
    ...(data || {}),
  };

  const payload = JSON.stringify(entry);

  if (level === LOG_LEVEL.ERROR) {
    console.error(payload);
    return;
  }

  console.log(payload);
}
