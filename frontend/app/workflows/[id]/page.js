import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { getWorkflowById } from '@/content/mockWorkflows';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WorkflowDetailPage({ params }) {
  const workflow = getWorkflowById(params.id);

  return (
    <AppShell title="Workflow Detail" description="Inspect a reusable memory workflow and continue into Brain, Agents or Integrations.">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/workflows">Back to workflows</Link>
          </Button>
          <Button asChild>
            <Link href={`/brain?workflow=${params.id}`}>Preview in Brain</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/agents">Choose agent</Link>
          </Button>
        </div>

        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>{workflow ? workflow.name : `Workflow ID: ${params.id}`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            {workflow ? (
              <>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4 text-foreground">
                  {workflow.description}
                </div>
                <div className="space-y-3">
                  {workflow.steps.map((step, index) => (
                    <div key={step} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Step {index + 1}</div>
                      <div className="mt-1 text-foreground">{step}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                Workflow not found. This route is ready for API-backed workflow records.
              </div>
            )}

            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              Future view: workflow run history, trigger mapping, memory writeback rules and automation templates.
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
