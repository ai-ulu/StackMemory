import { AppShell } from '@/components/app/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const integrations = [
  ['MCP', 'Connect compatible agent clients to shared memory.'],
  ['REST API', 'Write, search and query memories from custom apps.'],
  ['n8n', 'Use StackMemory inside automation workflows.'],
  ['SDK', 'Embed durable memory into developer tools and internal copilots.'],
];

export default function IntegrationsPage() {
  return (
    <AppShell title="Integrations" description="Connect StackMemory to tools, agents and builder workflows.">
      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map(([title, body]) => (
          <Card key={title} className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{body}</p>
              <Button variant="outline" className="w-full">View setup</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
