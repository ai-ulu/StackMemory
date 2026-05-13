import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const agents = [
  ['Claude Code', 'Pull project rules and session memory into coding runs.'],
  ['Cursor', 'Reuse decisions and preferences across IDE sessions.'],
  ['Codex-style agent', 'Give code agents stable project context before tasks.'],
  ['Replit', 'Carry memory into cloud IDE workflows.'],
  ['Bolt / Lovable', 'Reuse product requirements in builder tools.'],
  ['Custom App / n8n', 'Embed StackMemory into your own automation stack.'],
];

export default function AgentsPage() {
  return (
    <AppShell title="Agents" description="Define where StackMemory should provide reusable context.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map(([agent, body]) => (
          <Card key={agent} className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle>{agent}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{body}</p>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/integrations?agent=${encodeURIComponent(agent)}`}>Configure</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
