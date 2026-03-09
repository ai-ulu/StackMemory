export function getConfiguredAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_URL ||
    process.env.APP_URL ||
    ''
  ).trim();
}

export function getAppBaseUrl(request) {
  if (request?.url) {
    try {
      return new URL(request.url).origin;
    } catch {
      // Fall through to configured envs.
    }
  }

  const configuredUrl = getConfiguredAppUrl();
  if (configuredUrl) {
    return configuredUrl;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'App base URL is not configured. Set NEXT_PUBLIC_APP_URL or APP_URL.'
    );
  }

  return 'http://localhost:3000';
}
