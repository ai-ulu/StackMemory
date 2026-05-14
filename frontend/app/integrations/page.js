import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { mockIntegrations } from '@/content/mockIntegrations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function IntegrationsPage() {
  return (
    <AppShell title="Integrations" description="Connect StackMemory to tools, agents and builder workflows.">
      <div className="space-y-6">
        <div className="rounded-3xl border border-border/60 bg-card/60 p-5">
          <div className="font-medium">Setup path</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick an integration surface, then open the quick start docs for the exact workflow.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {mockIntegrations.map((integration) => (
            <Card key={integration.id} className="border-border/60 bg-card/60">
              <CardHeader>
                <CardTitle>{integration.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="inline-flex rounded-full border border-border/60 px-3 py-1 text-xs uppercase tracking-wide">
                  {integration.status}
                </div>
                <p>{integration.description}</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href={integration.docsHref}>View setup</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
