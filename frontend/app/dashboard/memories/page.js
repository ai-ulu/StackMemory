import Link from 'next/link';
import { ArrowLeft, Search, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { memoryService } from '@/features/memory/memory.service';

function MemoryTypeBadge({ type }) {
  return <Badge variant="secondary">{type}</Badge>;
}

function ConfidenceBar({ value }) {
  const percent = Math.round(value * 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Confidence</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default async function MemoriesPage({ searchParams }) {
  const query = typeof searchParams?.q === 'string' ? searchParams.q : '';
  const type = typeof searchParams?.type === 'string' ? searchParams.type : 'all';
  const memories = await memoryService.listMemories({ query, type, limit: 50 });
  const summary = await memoryService.getSummary();

  return (
    <main className="min-h-screen bg-background">
      <div className="container space-y-8 py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Button asChild variant="ghost" className="mb-4 px-0">
              <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard</Link>
            </Button>
            <Badge variant="outline" className="mb-3">Memory Explorer MVP</Badge>
            <h1 className="text-3xl font-bold tracking-tight">Memory Explorer</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              İlk sürüm mock repository ile çalışıyor. Bir sonraki adımda aynı servis katmanı Supabase `memories` tablosuna bağlanacak.
            </p>
          </div>
          <Button disabled>New memory soon</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{summary.total}</CardContent>
          </Card>
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{summary.active}</CardContent>
          </Card>
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{summary.pending}</CardContent>
          </Card>
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Deprecated</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{summary.deprecated}</CardContent>
          </Card>
        </div>

        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Explorer controls</CardTitle>
                <CardDescription>Bu PR’da form yerine query param ile okuma yapılır; yazma Supabase adapter PR’ında gelir.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
              <Search className="mr-2 inline h-4 w-4" />
              Kullanım: <code className="rounded bg-muted px-1 py-0.5">/dashboard/memories?q=supabase</code> veya <code className="rounded bg-muted px-1 py-0.5">?type=decision</code>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {memories.map((memory) => (
            <Card key={memory.id} className="border-border/60 bg-card/60">
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <MemoryTypeBadge type={memory.type} />
                      <Badge variant="outline">{memory.status}</Badge>
                      <Badge variant="outline">{memory.scope}</Badge>
                    </div>
                    <CardTitle className="text-lg leading-7">{memory.content}</CardTitle>
                  </div>
                  <div className="min-w-40">
                    <ConfidenceBar value={memory.confidence} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {memory.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="grid gap-3 text-xs text-muted-foreground md:grid-cols-3">
                  <div>Access count: {memory.accessCount}</div>
                  <div>Decay: {Math.round(memory.decayFactor * 100)}%</div>
                  <div>Updated: {new Date(memory.updatedAt).toLocaleDateString('tr-TR')}</div>
                </div>
              </CardContent>
            </Card>
          ))}

          {!memories.length && (
            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-8 text-center text-muted-foreground">
                No memories matched this filter.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
