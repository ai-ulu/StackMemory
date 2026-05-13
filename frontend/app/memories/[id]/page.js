import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MemoryDetailPage({ params }) {
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
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              Memory content, type, confidence, importance, decay and access history will appear here.
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              Future view: related memories, graph edges and context compiler impact.
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
