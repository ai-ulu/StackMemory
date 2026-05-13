import { AppShell } from '@/components/app/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const workflows = [
  'Coding session handoff',
  'Project rule capture',
  'Context preview before agent run',
  'Post-run memory writeback',
];

export default function WorkflowsPage() {
  return (
    <AppShell title="Workflows" description="Reusable memory flows for agents and builder automations.">
      <div className="grid gap-4 lg:grid-cols-2">
        {workflows.map((workflow) => (
          <Card key={workflow} className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle>{workflow}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Draft workflow card. Steps and automation wiring will come after the app skeleton is complete.
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
