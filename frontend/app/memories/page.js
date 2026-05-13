import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { mockMemories } from '@/content/mockMemories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MemoriesPage() {
  return (
    <AppShell title="Memories" description="Search, inspect and organize reusable agent context.">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-card/60 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-medium">Memory explorer</div>
            <div className="text-sm text-muted-foreground">Open a memory to inspect metadata, retrieval signals and future graph edges.</div>
          </div>
          <Button>Create memory</Button>
        </div>

        <div className="grid gap-4">
          {mockMemories.map((memory) => (
            <Link key={memory.id} href={`/memories/${memory.id}`}>
              <Card className="border-border/60 bg-card/60 transition-colors hover:border-primary/40 hover:bg-card/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">{memory.type}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>{memory.content}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>confidence {Math.round(memory.confidence * 100)}%</span>
                    <span>importance {Math.round(memory.importance * 100)}%</span>
                    <span>decay {Math.round(memory.decay * 100)}%</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
