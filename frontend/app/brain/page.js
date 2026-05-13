import { AppShell } from '@/components/app/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  ['Agent type', 'Coding agent, automation agent, research agent, edge device'],
  ['Token budget', 'Preview how much context each run can carry'],
  ['Risk level', 'Control strictness for high-impact agent actions'],
  ['Memory selection', 'Score by relevance, importance, decay and workflow fit'],
];

export default function BrainPage() {
  return (
    <AppShell title="Brain" description="Preview the context compiler and future quantum-inspired memory selector.">
      <div className="grid gap-6 lg:grid-cols-2">
        {sections.map(([title, body]) => (
          <Card key={title} className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{body}</CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
