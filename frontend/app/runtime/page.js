import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { getMemoryRuntimeConfig, withNamespaceHref } from '@/lib/memories/config';
import { listMemories } from '@/lib/memories/service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default async function RuntimePage({ searchParams }) {
  const namespace = String(searchParams?.namespace || '').trim() || undefined;
  const config = getMemoryRuntimeConfig(namespace);
  const memories = await listMemories({ limit: 10, namespace: config.namespace });
  const configRows = [
    ['MCP endpoint', config.endpoint, config.endpointSource],
    ['Namespace', config.namespace, config.namespaceSource],
    ['Bearer token', config.hasToken ? 'configured' : 'not configured', config.tokenSource],
  ];
  return (
    <AppShell title="Runtime" description="Inspect the active MCP backend endpoint and memory namespace.">
      <div className="space-y-6">
        <Card className="border-border/60 bg-card/60"><CardHeader><CardTitle>Runtime configuration</CardTitle></CardHeader><CardContent className="grid gap-3">
          {configRows.map(([label, value, source]) => <div key={label} className="rounded-2xl border border-border/60 bg-background/60 p-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 break-all font-mono text-sm text-foreground">{value}</div><div className="mt-1 text-xs text-muted-foreground">Source: {source}</div></div>)}
        </CardContent></Card>
        <Card className="border-border/60 bg-card/60"><CardHeader><CardTitle>Preview another namespace</CardTitle></CardHeader><CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_auto]" action="/runtime"><Input name="namespace" placeholder="demo:stackmemory, user:123, team:alpha..." defaultValue={config.namespace} /><Button type="submit">Preview namespace</Button></form>
          <div className="mt-4 flex flex-wrap gap-3"><Button asChild variant="outline"><Link href={withNamespaceHref('/memories', config.namespace)}>Open memories</Link></Button><Button asChild variant="outline"><Link href={withNamespaceHref('/brain', config.namespace)}>Open Brain</Link></Button><Button asChild><Link href={withNamespaceHref('/memories/new', config.namespace)}>Create memory here</Link></Button></div>
        </CardContent></Card>
        <Card className="border-border/60 bg-card/60"><CardHeader><CardTitle>Connection sample</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground">
          {memories.slice(0, 5).map((memory) => <Link key={memory.id} href={withNamespaceHref(`/memories/${memory.id}`, config.namespace)} className="block rounded-2xl border border-border/60 bg-background/60 p-4 transition-colors hover:bg-muted/50"><div className="text-xs uppercase tracking-wide text-muted-foreground">{memory.type}</div><div className="mt-1 text-foreground">{memory.content}</div></Link>)}
          {!memories.length && <div className="rounded-2xl border border-border/60 bg-background/60 p-4">No records found for this namespace.</div>}
        </CardContent></Card>
      </div>
    </AppShell>
  );
}
