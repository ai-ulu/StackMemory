import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const guides = [
  ['1. Create workspace', 'Set a default namespace and choose your primary workflow.', '/settings'],
  ['2. Add memories', 'Store project rules, preferences, decisions and active tasks.', '/memories'],
  ['3. Preview context', 'Use Brain to see which memories would be sent to an agent.', '/brain'],
  ['4. Connect tools', 'Use integrations to wire MCP, API, n8n or SDK surfaces.', '/integrations'],
];

export default function DocsPage() {
  return (
    <AppShell title="Docs" description="Quick start guides for using StackMemory as an app and as infrastructure.">
      <div className="grid gap-4 lg:grid-cols-2">
        {guides.map(([title, body, href]) => (
          <Card key={title} className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{body}</p>
              <Button asChild variant="outline" className="w-full">
                <Link href={href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
