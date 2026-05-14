import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { withNamespaceHref } from '@/lib/memories/config';
import { getContextPreviewMemories, getMemory, searchMemories } from '@/lib/memories/service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  ['Agent type', 'Coding agent, automation agent, research agent, edge device'],
  ['Token budget', 'Preview how much context each run can carry'],
  ['Risk level', 'Control strictness for high-impact agent actions'],
  ['Memory selection', 'Score by relevance, importance, decay and workflow fit'],
];

async function getPreview(searchParams, namespace) {
  const memoryId = searchParams?.memory;
  if (!memoryId) return getContextPreviewMemories(3, { namespace });
  const memory = await getMemory(memoryId, { namespace });
  if (!memory) return getContextPreviewMemories(3, { namespace });
  const matches = await searchMemories({ query: memory.content, namespace, limit: 3 });
  return matches.length ? matches : getContextPreviewMemories(3, { namespace });
}

export default async function BrainPage({ searchParams }) {
  const namespace = String(searchParams?.namespace || '').trim();
  const preview = await getPreview(searchParams, namespace);

  return (
    <AppShell title="Brain" description="Preview the context compiler and memory selector.">
      <div className="space-y-6">
        {namespace && <div className="rounded-2xl border border-border/60 bg-card/60 p-4 font-mono text-xs text-muted-foreground">namespace: {namespace}</div>}
        <div className="grid gap-6 lg:grid-cols-2">
          {sections.map(([title, body]) => <Card key={title} className="border-border/60 bg-card/60"><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{body}</CardContent></Card>)}
        </div>
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between gap-3"><CardTitle>Context preview</CardTitle><Button asChild><Link href={withNamespaceHref('/memories', namespace)}>Choose memory</Link></Button></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {preview.map((memory) => <Link key={memory.id} href={withNamespaceHref(`/memories/${memory.id}`, namespace)} className="block rounded-2xl border border-border/60 bg-background/60 p-4 transition-colors hover:bg-muted/50"><div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">{memory.type}</div><div className="text-foreground">{memory.content}</div><div className="mt-2 text-xs text-muted-foreground">score {Math.round((memory.importance + memory.confidence - memory.decay) * 50)} / 100</div></Link>)}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
