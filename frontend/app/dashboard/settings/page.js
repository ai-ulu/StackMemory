import { Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <>
      <div>
        <Badge variant="outline" className="mb-3">Coming next</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Memory preferences, privacy mode, safe mode, decay controls and project settings will land in the next implementation pass.
        </p>
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Settings backlog</CardTitle>
              <CardDescription>Prepared for the next PR without blocking the shell navigation.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Memory enabled</div>
          <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Privacy mode</div>
          <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Safe mode</div>
          <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Decay half-life</div>
        </CardContent>
      </Card>
    </>
  );
}
