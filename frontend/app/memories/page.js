import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const memories = [
  ['later-phase-work', 'rule', 'Keep MCP, billing and OAuth for later phases.'],
  ['skeleton-before-polish', 'preference', 'Prefer product skeleton first, polish later.'],
  ['shared-agent-memory', 'decision', 'Use StackMemory as a shared memory layer for LLM agents.'],
  ['build-product-screens', 'task', 'Build dashboard, memories, brain, agents and workflows screens.'],
];

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
          {memories.map(([id, type, content]) => (
            <Link key={id} href={`/memories/${id}`}>
              <Card className="border-border/60 bg-card/60 transition-colors hover:border-primary/40 hover:bg-card/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">{type}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">{content}</CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
