import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MemoryDetailPage({ params }) {
  return (
    <AppShell title="Memory Detail" description="Inspect one memory, its metadata and future retrieval signals.">
      <div className="space-y-6">
        <Link href="/memories">
          <Button variant="outline">Back to memories</Button>
        </Link>

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
