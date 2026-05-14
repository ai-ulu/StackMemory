import { NextResponse } from 'next/server';

export function apiError(error) {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  const status = message === 'Unauthorized' ? 401 : message === 'Not found' ? 404 : 500;

  return NextResponse.json({ error: message }, { status });
}

export function apiUnauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function apiBadRequest(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function apiPaymentRequired(message, details = {}) {
  return NextResponse.json({ error: message, ...details }, { status: 402 });
}
