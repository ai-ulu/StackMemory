import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  ['Agent type', 'Coding agent, automation agent, research agent, edge device'],
  ['Token budget', 'Preview how much context each run can carry'],
  ['Risk level', 'Control strictness for high-impact agent actions'],
  ['Memory selection', 'Score by relevance, importance, decay and workflow fit'],
];

const preview = [
  'Prefer product skeleton first, polish later.',
  'Keep MCP, billing and OAuth for later phases.',
  'Use StackMemory as a shared memory layer for LLM agents.',
];

export default function BrainPage() {
  return (
    <AppShell title="Brain" description="Preview the context compiler and future quantum-inspired memory selector.">
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {sections.map(([title, body]) => (
            <Card key={title} className="border-border/60 bg-card/60">
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{body}</CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/60 bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Context preview</CardTitle>
            <Button asChild>
              <Link href="/agents">Choose agent</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {preview.map((item) => (
              <div key={item} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
