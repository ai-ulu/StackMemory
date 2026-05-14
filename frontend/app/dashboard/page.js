import Link from 'next/link';
import { BarChart3, Brain, Database, GitBranch, ShieldCheck, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createAuthenticatedMemoryService } from '@/features/memory/memory.api';

const emptySummary = {
  total: 0,
  active: 0,
  deprecated: 0,
  avgConfidence: 0,
  byType: {},
};

async function getOverviewData() {
  try {
    const service = await createAuthenticatedMemoryService();
    const [summary, memories] = await Promise.all([
      service.getSummary(),
      service.listMemories({ limit: 4 }),
    ]);

    return { summary, memories };
  } catch {
    return { summary: emptySummary, memories: [] };
  }
}

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
  const { summary, memories } = await getOverviewData();

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Badge variant="outline" className="mb-3">Context control plane</Badge>
          <h1 className="text-3xl font-bold tracking-tight">StackMemory Dashboard</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Memory, Graph, Brain ve Context Optimizer aynı app-first ürün yüzeyinde birleşiyor.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/context">Context Optimizer</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/memories">Memory Explorer</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/graph">Graph</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Memories" value={summary.total} description="Real workspace memory count from Supabase" icon={Database} />
        <StatCard title="Active" value={summary.active} description="Usable memories in the current workspace" icon={ShieldCheck} />
        <StatCard title="Avg Confidence" value={`${Math.round(summary.avgConfidence * 100)}%`} description="Service-level summary calculation" icon={Sparkles} />
        <StatCard title="Context Optimizer" value="MVP" description="Estimate and compile token-budgeted context" icon={BarChart3} />
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
              'Graph memory_links tablosuna bağlandı: ilişkiler artık DB’ye yazılıyor ve okunuyor.',
              'Context Optimizer eklendi: memory seçimi token bütçesine göre yapılıyor ve tasarruf metriği üretiyor.',
              'MCP legacy dosyası pasifleştirildi; aktif MCP app-adapter üzerinden app API’ye bağlanıyor.',
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
            <CardDescription>Supabase üzerinden gelen son workspace hafızaları.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {memories.length ? memories.map((memory) => (
              <div key={memory.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge variant="secondary">{memory.type}</Badge>
                  <span className="text-xs text-muted-foreground">{Math.round(memory.confidence * 100)}%</span>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{memory.content}</p>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-8 text-center text-sm text-muted-foreground">
                Henüz memory yok. İlk kayıtları Memory Explorer ekranından oluşturabilirsin.
              </div>
            )}
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
              <CardTitle>Next pass</CardTitle>
              <CardDescription>Build/deploy config, usage charts, Stripe persistence and production hardening.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </>
  );
}
