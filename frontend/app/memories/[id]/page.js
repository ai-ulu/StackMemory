import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { getMemory } from '@/lib/memories/service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function MemoryDetailPage({ params }) {
  const memory = await getMemory(params.id);

  return (
    <AppShell title="Memory Detail" description="Inspect one memory, its metadata and future retrieval signals.">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/memories">Back to memories</Link>
          </Button>
          <Button asChild>
            <Link href={`/brain?memory=${params.id}`}>Preview in Brain</Link>
          </Button>
        </div>

        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>Memory ID: {params.id}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            {memory ? (
              <>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4 text-foreground">
                  {memory.content}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Type: {memory.type}</div>
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Source: {memory.source}</div>
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Confidence: {Math.round(memory.confidence * 100)}%</div>
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Importance: {Math.round(memory.importance * 100)}%</div>
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Decay: {Math.round(memory.decay * 100)}%</div>
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Retrieval: MCP-backed preview</div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                Memory not found. This route is ready for real API-backed records.
              </div>
            )}

            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              Future view: related memories, graph edges and context compiler impact.
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
