import { AppShell } from '@/components/app/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const agents = ['Claude Code', 'Cursor', 'Codex-style agent', 'Replit', 'Bolt / Lovable', 'Custom App / n8n'];

export default function AgentsPage() {
  return (
    <AppShell title="Agents" description="Define where StackMemory should provide reusable context.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent} className="border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle>{agent}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Connection setup placeholder.</p>
              <Button variant="outline" className="w-full">Configure</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
