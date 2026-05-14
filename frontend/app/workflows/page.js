import { AppShell } from '@/components/app/AppShell';
import { mockWorkflows } from '@/content/mockWorkflows';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WorkflowsPage() {
  return (
    <AppShell title="Workflows" description="Reusable memory flows for agents and builder automations.">
      <div className="grid gap-4 lg:grid-cols-2">
        {mockWorkflows.map((workflow) => (
          <Card key={workflow.id} className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle>{workflow.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{workflow.description}</p>
              <div className="space-y-2">
                {workflow.steps.map((step, index) => (
                  <div key={step} className="rounded-2xl border border-border/60 bg-background/60 p-3">
                    {index + 1}. {step}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
