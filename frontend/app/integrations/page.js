import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const integrations = [
  ['MCP', 'Connect compatible agent clients to shared memory.', '/docs?section=mcp'],
  ['REST API', 'Write, search and query memories from custom apps.', '/docs?section=api'],
  ['n8n', 'Use StackMemory inside automation workflows.', '/docs?section=n8n'],
  ['SDK', 'Embed durable memory into developer tools and internal copilots.', '/docs?section=sdk'],
];

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
          {integrations.map(([title, body, href]) => (
            <Card key={title} className="border-border/60 bg-card/60">
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>{body}</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href={href}>View setup</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
