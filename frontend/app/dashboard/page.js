import Link from 'next/link';
import { Brain, Database, GitBranch, ShieldCheck, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { memoryService } from '@/features/memory/memory.service';

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const summary = await memoryService.getSummary();
  const memories = await memoryService.listMemories({ limit: 4 });

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Badge variant="outline" className="mb-3">Product shell</Badge>
          <h1 className="text-3xl font-bold tracking-tight">StackMemory Dashboard</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Uygulama artık ortak dashboard shell içinde ilerliyor: Memory, Brain, Graph, Settings ve Billing aynı ürün yüzeyinde toplanıyor.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/memories">Memory Explorer</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/brain">Brain</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/graph">Graph</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Memories" value={summary.total} description="Overview uses mock service until dashboard auth binding lands" icon={Database} />
        <StatCard title="Active" value={summary.active} description="Usable memories in the current workspace" icon={ShieldCheck} />
        <StatCard title="Avg Confidence" value={`${Math.round(summary.avgConfidence * 100)}%`} description="Service-level summary calculation" icon={Sparkles} />
        <StatCard title="Brain + Graph" value="MVP" description="Available through the product shell navigation" icon={Brain} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>Current product path</CardTitle>
            <CardDescription>Listeyi bozmadan, küçük ve güvenli parçalarla ilerliyoruz.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            {[
              'App-first foundation kuruldu: ekranlar artık feature/service/repository sınırına sahip.',
              'Supabase memory adapter eklendi: API route akışı MCP yerine app service üzerinden ilerliyor.',
              'Memory CRUD UI eklendi: listele, oluştur, düzenle ve deprecate et.',
              'Brain + Graph MVP eklendi: memory service üstünden analiz ve ilişki görselleştirme başladı.',
              'Product shell eklendi: sidebar, topbar ve ortak dashboard navigasyonu.',
            ].map((item, index) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </div>
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>Recent memory signals</CardTitle>
            <CardDescription>Dashboard overview için ilk ürün sinyalleri.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {memories.map((memory) => (
              <div key={memory.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge variant="secondary">{memory.type}</Badge>
                  <span className="text-xs text-muted-foreground">{Math.round(memory.confidence * 100)}%</span>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{memory.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <GitBranch className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Next PR</CardTitle>
              <CardDescription>Settings + Billing: memory preferences, usage cards and plan surface.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </>
  );
}
