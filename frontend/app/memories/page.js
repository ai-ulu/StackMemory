import { AppShell } from '@/components/app/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const memories = [
  ['rule', 'Keep MCP, billing and OAuth for later phases.'],
  ['preference', 'Prefer product skeleton first, polish later.'],
  ['decision', 'Use StackMemory as a shared memory layer for LLM agents.'],
  ['task', 'Build dashboard, memories, brain, agents and workflows screens.'],
];

export default function MemoriesPage() {
  return (
    <AppShell title="Memories" description="Search, inspect and organize reusable agent context.">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-card/60 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-medium">Memory explorer</div>
            <div className="text-sm text-muted-foreground">Filters and real search wiring come after the full skeleton is complete.</div>
          </div>
          <Button>Create memory</Button>
        </div>

        <div className="grid gap-4">
          {memories.map(([type, content]) => (
            <Card key={content} className="border-border/60 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">{type}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{content}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
