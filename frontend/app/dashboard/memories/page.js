import { Badge } from '@/components/ui/badge';
import { MemoryExplorerClient } from '@/features/memory/components/MemoryExplorerClient';

export default function MemoriesPage() {
  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Badge variant="outline" className="mb-3">Memory CRUD UI</Badge>
          <h1 className="text-3xl font-bold tracking-tight">Memory Explorer</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Bu ekran `/api/memories` üzerinden listeler, oluşturur, düzenler ve deprecate eder. MCP hâlâ parkta; akış app service + Supabase adapter üzerinden ilerler.
          </p>
        </div>
      </div>

      <MemoryExplorerClient />
    </>
  );
}
