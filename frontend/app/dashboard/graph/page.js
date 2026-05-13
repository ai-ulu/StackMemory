import { Badge } from '@/components/ui/badge';
import { MemoryGraphClient } from '@/features/graph/components/MemoryGraphClient';

export default function GraphPage() {
  return (
    <>
      <div>
        <Badge variant="outline" className="mb-3">Graph MVP</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Memory Graph</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Memory nodes and relationship edges are shown in the shared product shell. A later version will use explicit memory link records.
        </p>
      </div>

      <MemoryGraphClient />
    </>
  );
}
