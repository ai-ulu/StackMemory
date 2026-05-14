import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { MetricCard } from '@/components/app/MetricCard';
import { withNamespaceHref } from '@/lib/memories/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { listMemories } from '@/lib/memories/service';

const actions = [
  ['Create or inspect memories', '/memories', 'Add project rules, decisions and active work.'],
  ['Preview agent context', '/brain', 'See what the next agent run will remember.'],
  ['Review usage and cost', '/usage', 'Track token pressure before billing work starts.'],
];

const demoShortcuts = [
  ['Agents', '/agents', 'Connect a target tool'],
  ['Workflows', '/workflows', 'Run a reusable flow'],
  ['Integrations', '/integrations', 'Choose MCP, API, n8n or SDK'],
  ['Docs', '/docs', 'Open quick start guides'],
];

function estimateTokens(memories) {
  return memories.reduce((sum, memory) => sum + Math.ceil(memory.content.length / 4), 0);
}

export default async function DashboardPage({ searchParams }) {
  const namespace = String(searchParams?.namespace || '').trim();
  const memories = await listMemories({ limit: 50, namespace });
  const tokenEstimate = estimateTokens(memories);
  const metrics = [
    ['Memories', String(memories.length), 'Stored project facts and rules'],
    ['Agents', '6', 'Connected workflow targets'],
    ['Context Health', memories.length ? '82%' : '0%', 'Ready for compiler preview'],
    ['Token Saved', `${Math.max(tokenEstimate * 3, 0).toLocaleString()}`, 'Estimated repeated context avoided'],
  ];

  return (
    <AppShell title="Dashboard" description="High-level product command center for your shared memory layer.">
      <div className="space-y-8">
        {namespace && <div className="rounded-2xl border border-border/60 bg-card/60 p-4 font-mono text-xs text-muted-foreground">namespace: {namespace}</div>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map(([label, value, hint]) => <MetricCard key={label} label={label} value={value} hint={hint} />)}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/60 bg-card/60">
            <CardHeader><CardTitle>Next best actions</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              {actions.map(([title, href, body]) => (
                <Link key={href} href={withNamespaceHref(href, namespace)} className="rounded-2xl border border-border/60 p-4 transition-colors hover:bg-muted/50">
                  <div className="font-medium text-foreground">{title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{body}</div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Recent memory signals</CardTitle>
              <Button asChild variant="outline" size="sm"><Link href={withNamespaceHref('/memories', namespace)}>View all</Link></Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {memories.slice(0, 5).map((memory) => (
                <Link key={memory.id} href={withNamespaceHref(`/memories/${memory.id}`, namespace)} className="block rounded-2xl border border-border/60 bg-background/60 p-4 transition-colors hover:bg-muted/50">{memory.content}</Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60 bg-card/60">
          <CardHeader><CardTitle>Demo shortcuts</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {demoShortcuts.map(([title, href, body]) => (
              <Link key={href} href={withNamespaceHref(href, namespace)} className="rounded-2xl border border-border/60 bg-background/60 p-4 transition-colors hover:bg-muted/50">
                <div className="font-medium">{title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{body}</div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
