import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { MetricCard } from '@/components/app/MetricCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockMemories } from '@/content/mockMemories';

const actions = [
  ['Create or inspect memories', '/memories', 'Add project rules, decisions and active work.'],
  ['Preview agent context', '/brain', 'See what the next agent run will remember.'],
  ['Review usage and cost', '/usage', 'Track token pressure before billing work starts.'],
];

export default function DashboardPage() {
  const metrics = [
    ['Memories', String(mockMemories.length), 'Stored project facts and rules'],
    ['Agents', '6', 'Connected workflow targets'],
    ['Context Health', '82%', 'Ready for compiler preview'],
    ['Token Saved', '41k', 'Estimated repeated context avoided'],
  ];

  return (
    <AppShell title="Dashboard" description="High-level product command center for your shared memory layer.">
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map(([label, value, hint]) => (
            <MetricCard key={label} label={label} value={value} hint={hint} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle>Next best actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              {actions.map(([title, href, body]) => (
                <Link key={href} href={href} className="rounded-2xl border border-border/60 p-4 transition-colors hover:bg-muted/50">
                  <div className="font-medium text-foreground">{title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{body}</div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Recent memory signals</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/memories">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {mockMemories.map((memory) => (
                <Link key={memory.id} href={`/memories/${memory.id}`} className="block rounded-2xl border border-border/60 bg-background/60 p-4 transition-colors hover:bg-muted/50">
                  {memory.content}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
