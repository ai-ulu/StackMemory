export const MAX_CONTENT_PREVIEW = 500;
export const MAX_RESPONSE_ITEMS = 200;

export function truncateContent(content: string, maxLen: number = MAX_CONTENT_PREVIEW): string {
  if (content.length <= maxLen) return content;
  return `${content.slice(0, maxLen)}…[truncated]`;
}

export function truncateMemoryResults(
  memories: Record<string, unknown>[],
  maxItems: number = MAX_RESPONSE_ITEMS,
  truncateFields = true,
): Record<string, unknown>[] {
  const limited = memories.slice(0, maxItems);

  if (!truncateFields) return limited;

  return limited.map(memory => ({
    ...memory,
    content: truncateContent(String(memory.content || ''), MAX_CONTENT_PREVIEW),
  }));
}
