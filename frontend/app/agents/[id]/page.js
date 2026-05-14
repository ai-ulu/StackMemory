import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { getAgentById } from '@/content/mockAgents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const recommendedMemoryTypes = ['rule', 'preference', 'decision', 'task'];
const recommendedWorkflows = [
  ['Coding session handoff', '/workflows/coding-session-handoff'],
  ['Context preview before agent run', '/workflows/context-preview-before-agent-run'],
  ['Post-run memory writeback', '/workflows/post-run-memory-writeback'],
];

export default function AgentDetailPage({ params }) {
  const agent = getAgentById(params.id);

  return (
    <AppShell title="Agent Detail" description="Inspect an agent target and continue into setup, workflows or context preview.">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/agents">Back to agents</Link>
          </Button>
          <Button asChild>
            <Link href={agent?.setupHref || '/integrations'}>Configure integration</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/brain?agent=${params.id}`}>Preview in Brain</Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Card className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle>{agent ? agent.name : `Agent ID: ${params.id}`}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              {agent ? (
                <>
                  <div className="inline-flex rounded-full border border-border/60 px-3 py-1 text-xs uppercase tracking-wide">
                    {agent.category}
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4 text-foreground">
                    {agent.description}
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                    Setup path: configure integration, preview context in Brain, then use a workflow template for repeated runs.
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  Agent not found. This route is ready for API-backed agent records.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle>Recommended memory shape</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="grid grid-cols-2 gap-2">
                {recommendedMemoryTypes.map((type) => (
                  <div key={type} className="rounded-2xl border border-border/60 bg-background/60 p-3 uppercase tracking-wide">
                    {type}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {recommendedWorkflows.map(([label, href]) => (
                  <Link key={href} href={href} className="block rounded-2xl border border-border/60 bg-background/60 p-3 transition-colors hover:bg-muted/50">
                    {label}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
