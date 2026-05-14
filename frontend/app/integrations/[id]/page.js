import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { getIntegrationById } from '@/content/mockIntegrations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const setupSteps = [
  'Choose the workflow or agent that needs shared memory.',
  'Create or select the workspace namespace.',
  'Write memories through the integration surface.',
  'Preview selected memories in Brain before agent execution.',
];

export default function IntegrationDetailPage({ params }) {
  const integration = getIntegrationById(params.id);

  return (
    <AppShell title="Integration Detail" description="Inspect an integration surface and continue into setup documentation.">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/integrations">Back to integrations</Link>
          </Button>
          <Button asChild>
            <Link href={integration?.docsHref || '/docs'}>Open docs</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/brain">Preview in Brain</Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Card className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle>{integration ? integration.name : `Integration ID: ${params.id}`}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              {integration ? (
                <>
                  <div className="inline-flex rounded-full border border-border/60 px-3 py-1 text-xs uppercase tracking-wide">
                    {integration.status}
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4 text-foreground">
                    {integration.description}
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                    This detail view will later show credentials, scopes, endpoint status, SDK snippets and setup progress.
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  Integration not found. This route is ready for API-backed integration records.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle>Setup steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {setupSteps.map((step, index) => (
                <div key={step} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Step {index + 1}</div>
                  <div className="mt-1 text-foreground">{step}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
