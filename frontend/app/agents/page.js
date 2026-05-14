import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { mockAgents } from '@/content/mockAgents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AgentsPage() {
  return (
    <AppShell title="Agents" description="Define where StackMemory should provide reusable context.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mockAgents.map((agent) => (
          <Card key={agent.id} className="border-border/60 bg-card/60 transition-colors hover:border-primary/40 hover:bg-card/80">
            <CardHeader>
              <CardTitle>{agent.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="inline-flex rounded-full border border-border/60 px-3 py-1 text-xs uppercase tracking-wide">
                {agent.category}
              </div>
              <p>{agent.description}</p>
              <div className="grid gap-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/agents/${agent.id}`}>Open agent</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link href={agent.setupHref}>Configure</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
