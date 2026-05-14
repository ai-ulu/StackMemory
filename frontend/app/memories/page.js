import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { listMemories, searchMemories } from '@/lib/memories/service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const memoryTypes = ['all', 'rule', 'preference', 'decision', 'task', 'note'];

function statusMessage(status) {
  if (status === 'deleted') return 'Memory deleted through the MCP backend.';
  return null;
}

function errorMessage(error) {
  if (error === 'missing-id') return 'Memory id is required.';
  return null;
}

export default async function MemoriesPage({ searchParams }) {
  const query = String(searchParams?.q || '').trim();
  const type = String(searchParams?.type || 'all');
  const status = statusMessage(searchParams?.status);
  const error = errorMessage(searchParams?.error);
  const selectedType = type === 'all' ? undefined : type;
  const memories = query
    ? await searchMemories({ query, type: selectedType, limit: 50 })
    : await listMemories({ limit: 50, type: selectedType });

  return (
    <AppShell title="Memories" description="Search, inspect and organize reusable agent context.">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-card/60 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-medium">Memory explorer</div>
            <div className="text-sm text-muted-foreground">Open a memory to inspect metadata, retrieval signals and future graph edges.</div>
          </div>
          <Button asChild>
            <Link href="/memories/new">Create memory</Link>
          </Button>
        </div>

        {status && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700">
            {status}
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <form className="grid gap-3 rounded-3xl border border-border/60 bg-card/60 p-5 md:grid-cols-[1fr_180px_auto]" action="/memories">
          <Input name="q" placeholder="Search memories..." defaultValue={query} />
          <select name="type" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" defaultValue={type}>
            {memoryTypes.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button type="submit">Search</Button>
            <Button asChild variant="outline">
              <Link href="/memories">Reset</Link>
            </Button>
          </div>
        </form>

        <div className="grid gap-4">
          {memories.map((memory) => (
            <Link key={memory.id} href={`/memories/${memory.id}`}>
              <Card className="border-border/60 bg-card/60 transition-colors hover:border-primary/40 hover:bg-card/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">{memory.type}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>{memory.content}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>confidence {Math.round(memory.confidence * 100)}%</span>
                    <span>importance {Math.round(memory.importance * 100)}%</span>
                    <span>decay {Math.round(memory.decay * 100)}%</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {!memories.length && (
            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-6 text-sm text-muted-foreground">No memories found for this filter.</CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
