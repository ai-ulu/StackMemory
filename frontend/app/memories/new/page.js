import Link from 'next/link';
import { createMemoryAction } from '@/app/memories/actions';
import { AppShell } from '@/components/app/AppShell';
import { withNamespaceHref } from '@/lib/memories/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const memoryTypes = ['rule', 'preference', 'decision', 'task', 'note'];

function errorMessage(error) {
  if (error === 'missing-content') return 'Memory content is required.';
  if (error === 'create-failed') return 'Memory could not be saved through the MCP backend.';
  return null;
}

export default function NewMemoryPage({ searchParams }) {
  const namespace = String(searchParams?.namespace || '').trim();
  const error = errorMessage(searchParams?.error);

  return (
    <AppShell title="Create Memory" description="Draft a new reusable context item for future agent runs.">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>Memory draft</CardTitle>
            <CardDescription>Submit writes to the MCP-backed memory service.</CardDescription>
            {namespace && <div className="font-mono text-xs text-muted-foreground">namespace: {namespace}</div>}
          </CardHeader>
          <form action={createMemoryAction}>
            <CardContent className="space-y-5">
              {namespace && <input type="hidden" name="namespace" value={namespace} />}
              {error && <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select id="type" name="type" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" defaultValue="rule">
                  {memoryTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label htmlFor="content">Content</Label><Textarea id="content" name="content" placeholder="Example: Keep MCP, billing and OAuth for later phases." rows={6} required /></div>
              <div className="space-y-2"><Label htmlFor="source">Source</Label><Input id="source" name="source" placeholder="Planning session, repo analysis, user instruction..." defaultValue="Dashboard" /></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="importance">Importance</Label><Input id="importance" name="importance" type="number" min="0" max="100" defaultValue="90" /></div>
                <div className="space-y-2"><Label htmlFor="confidence">Confidence</Label><Input id="confidence" name="confidence" type="number" min="0" max="100" defaultValue="95" /></div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" className="w-full sm:w-auto">Save memory</Button>
              <Button asChild variant="outline" className="w-full sm:w-auto"><Link href={withNamespaceHref('/memories', namespace)}>Cancel</Link></Button>
            </CardFooter>
          </form>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader><CardTitle>Good memory checklist</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Reusable across future sessions.</div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Short enough to fit into context.</div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Clear type: rule, preference, decision, task or note.</div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Sensitive memory controls will be added later.</div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
