// Legacy MCP server disabled.
//
// The active MCP entrypoint is now src/app-adapter.ts.
// Build/deploy scripts in mcp-server/package.json point to app-adapter.ts.
//
// This file is intentionally kept as a tombstone to avoid confusion with the old all-in-one MCP implementation.

export default {
  async fetch() {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'legacy_mcp_disabled',
        message: 'Legacy MCP server is disabled. Use src/app-adapter.ts as the active entrypoint.',
      }),
      {
        status: 410,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      },
    );
  },
};
