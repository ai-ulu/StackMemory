import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { MetricCard } from '@/components/app/MetricCard';
import { withNamespaceHref } from '@/lib/memories/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { listMemories } from '@/lib/memories/service';

const notes = ['Track memory retrieval cost before adding billing.', 'Show token budget pressure per workflow.', 'Estimate savings from reduced repeated prompts.', 'Later connect real provider pricing and usage logs.'];

function estimateTokens(memories) { return memories.reduce((sum, memory) => sum + Math.ceil(memory.content.length / 4), 0); }
function estimateCost(tokens) { return `$${((tokens / 1000) * 0.002).toFixed(4)}`; }

export default async function UsagePage({ searchParams }) {
  const namespace = String(searchParams?.namespace || '').trim();
  const memories = await listMemories({ limit: 100, namespace });
  const tokens = estimateTokens(memories);
  const savings = tokens * 3;
  const metrics = [
    ['Memories indexed', String(memories.length), 'Records available for context selection'],
    ['Estimated tokens', tokens.toLocaleString(), 'Memory context volume from current records'],
    ['Token savings', savings.toLocaleString(), 'Repeated prompt context avoided'],
    ['Projected cost', estimateCost(tokens), 'Placeholder estimate for planning'],
  ];
  return (
    <AppShell title="Usage" description="Token, retrieval and cost planning signals for memory-powered agent runs.">
      <div className="space-y-8">
        {namespace && <div className="rounded-2xl border border-border/60 bg-card/60 p-4 font-mono text-xs text-muted-foreground">namespace: {namespace}</div>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, hint]) => <MetricCard key={label} label={label} value={value} hint={hint} />)}</div>
        <div className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-card/60 p-5 md:flex-row md:items-center md:justify-between"><div><div className="font-medium">Optimize next agent run</div><p className="mt-1 text-sm text-muted-foreground">Preview memory selection before increasing token volume or changing retention policy.</p></div><div className="flex gap-3"><Button asChild variant="outline"><Link href={withNamespaceHref('/brain', namespace)}>Open Brain</Link></Button><Button asChild><Link href={withNamespaceHref('/runtime', namespace)}>Runtime</Link></Button></div></div>
        <Card className="border-border/60 bg-card/60"><CardHeader><CardTitle>Cost model roadmap</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">{notes.map((note) => <div key={note} className="rounded-2xl border border-border/60 bg-background/60 p-4">{note}</div>)}</CardContent></Card>
      </div>
    </AppShell>
  );
}
