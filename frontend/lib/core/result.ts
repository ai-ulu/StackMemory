export type ResultError = {
  code: string;
  message: string;
  details?: unknown;
};

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: ResultError };

export function success<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function failure(code: string, message: string, details?: unknown): Result<never> {
  return { ok: false, error: { code, message, details } };
}
