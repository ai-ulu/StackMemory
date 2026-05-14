import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { SelectedTargetCard } from '@/components/app/SelectedTargetCard';
import { getAgentById } from '@/content/mockAgents';
import { withNamespaceHref } from '@/lib/memories/config';
import { getContextPreviewMemories, getMemory, searchMemories } from '@/lib/memories/service';
import { getWorkflowById } from '@/content/mockWorkflows';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  ['Agent type', 'Coding agent, automation agent, research agent, edge device'],
  ['Token budget', 'Preview how much context each run can carry'],
  ['Risk level', 'Control strictness for high-impact agent actions'],
  ['Memory selection', 'Score by relevance, importance, decay and workflow fit'],
];

async function getSelectedTarget(searchParams, namespace) {
  const memoryId = searchParams?.memory;
  const workflowId = searchParams?.workflow;
  const agentId = searchParams?.agent;

  if (memoryId) {
    const memory = await getMemory(memoryId, { namespace });
    return {
      label: 'Selected memory',
      title: memory?.content || memoryId,
      description: memory ? `Type: ${memory.type} · Source: ${memory.source}` : 'Memory route is ready for API-backed records.',
      href: withNamespaceHref(`/memories/${memoryId}`, namespace),
      query: memory?.content || memoryId,
    };
  }

  if (workflowId) {
    const workflow = getWorkflowById(workflowId);
    return {
      label: 'Selected workflow',
      title: workflow?.name || workflowId,
      description: workflow?.description || 'Workflow route is ready for API-backed records.',
      href: withNamespaceHref(`/workflows/${workflowId}`, namespace),
      query: workflow ? `${workflow.name} ${workflow.description} ${workflow.steps.join(' ')}` : workflowId,
    };
  }

  if (agentId) {
    const agent = getAgentById(agentId);
    return {
      label: 'Selected agent',
      title: agent?.name || agentId,
      description: agent?.description || 'Agent route is ready for API-backed records.',
      href: withNamespaceHref(`/agents/${agentId}`, namespace),
      query: agent ? `${agent.name} ${agent.category} ${agent.description}` : agentId,
    };
  }

  return null;
}

async function getPreviewForTarget(selectedTarget, namespace) {
  if (!selectedTarget?.query) return getContextPreviewMemories(3, { namespace });
  const matches = await searchMemories({ query: selectedTarget.query, namespace, limit: 3 });
  return matches.length ? matches : getContextPreviewMemories(3, { namespace });
}

export default async function BrainPage({ searchParams }) {
  const namespace = String(searchParams?.namespace || '').trim();
  const selectedTarget = await getSelectedTarget(searchParams, namespace);
  const preview = await getPreviewForTarget(selectedTarget, namespace);

  return (
    <AppShell title="Brain" description="Preview the context compiler and memory selector.">
      <div className="space-y-6">
        {namespace && <div className="rounded-2xl border border-border/60 bg-card/60 p-4 font-mono text-xs text-muted-foreground">namespace: {namespace}</div>}
        {selectedTarget && <SelectedTargetCard label={selectedTarget.label} title={selectedTarget.title} description={selectedTarget.description} href={selectedTarget.href} />}

        <div className="grid gap-6 lg:grid-cols-2">
          {sections.map(([title, body]) => (
            <Card key={title} className="border-border/60 bg-card/60">
              <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">{body}</CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/60 bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>{selectedTarget ? 'Targeted context preview' : 'Context preview'}</CardTitle>
            <Button asChild><Link href={withNamespaceHref('/agents', namespace)}>Choose agent</Link></Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {preview.map((memory) => (
              <Link key={memory.id} href={withNamespaceHref(`/memories/${memory.id}`, namespace)} className="block rounded-2xl border border-border/60 bg-background/60 p-4 transition-colors hover:bg-muted/50">
                <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">{memory.type}</div>
                <div className="text-foreground">{memory.content}</div>
                <div className="mt-2 text-xs text-muted-foreground">score {Math.round((memory.importance + memory.confidence - memory.decay) * 50)} / 100</div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
