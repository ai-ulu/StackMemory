import { AppShell } from '@/components/app/AppShell';
import { MetricCard } from '@/components/app/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const metrics = [
  ['Context compiled', '312', 'Agent runs with memory context'],
  ['Estimated tokens', '184k', 'Monthly memory context volume'],
  ['Token savings', '41k', 'Repeated prompt context avoided'],
  ['Projected cost', '$3.84', 'Placeholder estimate for planning'],
];

const notes = [
  'Track memory retrieval cost before adding billing.',
  'Show token budget pressure per workflow.',
  'Estimate savings from reduced repeated prompts.',
  'Later connect real provider pricing and usage logs.',
];

export default function UsagePage() {
  return (
    <AppShell title="Usage" description="Token, retrieval and cost planning signals for memory-powered agent runs.">
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map(([label, value, hint]) => (
            <MetricCard key={label} label={label} value={value} hint={hint} />
          ))}
        </div>

        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>Cost model roadmap</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            {notes.map((note) => (
              <div key={note} className="rounded-2xl border border-border/60 bg-background/60 p-4">{note}</div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
