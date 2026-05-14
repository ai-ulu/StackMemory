import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { SelectedTargetCard } from '@/components/app/SelectedTargetCard';
import { getAgentById } from '@/content/mockAgents';
import { getContextPreviewMemories, getMemoryById } from '@/content/mockMemories';
import { getWorkflowById } from '@/content/mockWorkflows';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  ['Agent type', 'Coding agent, automation agent, research agent, edge device'],
  ['Token budget', 'Preview how much context each run can carry'],
  ['Risk level', 'Control strictness for high-impact agent actions'],
  ['Memory selection', 'Score by relevance, importance, decay and workflow fit'],
];

function getSelectedTarget(searchParams) {
  const memoryId = searchParams?.memory;
  const workflowId = searchParams?.workflow;
  const agentId = searchParams?.agent;

  if (memoryId) {
    const memory = getMemoryById(memoryId);
    return {
      label: 'Selected memory',
      title: memory?.content || memoryId,
      description: memory ? `Type: ${memory.type} · Source: ${memory.source}` : 'Memory route is ready for API-backed records.',
      href: `/memories/${memoryId}`,
    };
  }

  if (workflowId) {
    const workflow = getWorkflowById(workflowId);
    return {
      label: 'Selected workflow',
      title: workflow?.name || workflowId,
      description: workflow?.description || 'Workflow route is ready for API-backed records.',
      href: `/workflows/${workflowId}`,
    };
  }

  if (agentId) {
    const agent = getAgentById(agentId);
    return {
      label: 'Selected agent',
      title: agent?.name || agentId,
      description: agent?.description || 'Agent route is ready for API-backed records.',
      href: `/agents/${agentId}`,
    };
  }

  return null;
}

export default function BrainPage({ searchParams }) {
  const preview = getContextPreviewMemories(3);
  const selectedTarget = getSelectedTarget(searchParams);

  return (
    <AppShell title="Brain" description="Preview the context compiler and future quantum-inspired memory selector.">
      <div className="space-y-6">
        {selectedTarget && (
          <SelectedTargetCard
            label={selectedTarget.label}
            title={selectedTarget.title}
            description={selectedTarget.description}
            href={selectedTarget.href}
          />
        )}

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
            {preview.map((memory) => (
              <Link key={memory.id} href={`/memories/${memory.id}`} className="block rounded-2xl border border-border/60 bg-background/60 p-4 transition-colors hover:bg-muted/50">
                <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">{memory.type}</div>
                <div className="text-foreground">{memory.content}</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  score {Math.round((memory.importance + memory.confidence - memory.decay) * 50)} / 100
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
