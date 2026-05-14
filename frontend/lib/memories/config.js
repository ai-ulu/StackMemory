const DEFAULT_MCP_URL = 'https://stackmemory-mcp.pages.dev/mcp';
const DEFAULT_NAMESPACE = 'demo:stackmemory';

export function getMemoryRuntimeConfig(namespaceOverride) {
  const namespace =
    namespaceOverride ||
    process.env.STACKMEMORY_NAMESPACE ||
    process.env.NEXT_PUBLIC_STACKMEMORY_NAMESPACE ||
    DEFAULT_NAMESPACE;

  const endpoint =
    process.env.MCP_SERVER_URL ||
    process.env.NEXT_PUBLIC_MCP_SERVER_URL ||
    DEFAULT_MCP_URL;

  return {
    namespace,
    endpoint,
    hasToken: Boolean(process.env.MCP_SERVER_TOKEN),
    tokenSource: process.env.MCP_SERVER_TOKEN ? 'MCP_SERVER_TOKEN' : 'not configured',
    namespaceSource: namespaceOverride
      ? 'request override'
      : process.env.STACKMEMORY_NAMESPACE
        ? 'STACKMEMORY_NAMESPACE'
        : process.env.NEXT_PUBLIC_STACKMEMORY_NAMESPACE
          ? 'NEXT_PUBLIC_STACKMEMORY_NAMESPACE'
          : 'default demo namespace',
    endpointSource: process.env.MCP_SERVER_URL
      ? 'MCP_SERVER_URL'
      : process.env.NEXT_PUBLIC_MCP_SERVER_URL
        ? 'NEXT_PUBLIC_MCP_SERVER_URL'
        : 'default live MCP endpoint',
  };
}

export function getMemoryNamespace(namespaceOverride) {
  return getMemoryRuntimeConfig(namespaceOverride).namespace;
}

export function withNamespaceHref(path, namespace) {
  if (!namespace) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}namespace=${encodeURIComponent(namespace)}`;
}
