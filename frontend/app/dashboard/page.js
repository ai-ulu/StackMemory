import { AppShell } from '@/components/app/AppShell';
import { MetricCard } from '@/components/app/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const metrics = [
  ['Memories', '1,248', 'Stored project facts and rules'],
  ['Agents', '6', 'Connected workflow targets'],
  ['Context Health', '82%', 'Ready for compiler preview'],
  ['Token Saved', '41k', 'Estimated repeated context avoided'],
];

const recent = [
  'Prefer small pull requests and visible diffs',
  'Claude Code is primary coding workflow',
  'StackMemory should become shared agent memory',
  'MCP, billing and OAuth are later-phase work',
];

export default function DashboardPage() {
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
              <div className="rounded-2xl border border-border/60 p-4">Create the memories list and filters.</div>
              <div className="rounded-2xl border border-border/60 p-4">Add context compiler preview for agent runs.</div>
              <div className="rounded-2xl border border-border/60 p-4">Wire real memory data after skeleton is complete.</div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle>Recent memory signals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {recent.map((item) => (
                <div key={item} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
