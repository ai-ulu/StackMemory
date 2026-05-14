import Link from 'next/link';
import { AppShell } from '@/components/app/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const memoryTypes = ['rule', 'preference', 'decision', 'task'];

export default function NewMemoryPage() {
  return (
    <AppShell title="Create Memory" description="Draft a new reusable context item for future agent runs.">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>Memory draft</CardTitle>
            <CardDescription>
              This is a skeleton form. Real persistence will be wired after the product flow is complete.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select id="type" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {memoryTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" placeholder="Example: Keep MCP, billing and OAuth for later phases." rows={6} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input id="source" placeholder="Planning session, repo analysis, user instruction..." />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="importance">Importance</Label>
                <Input id="importance" type="number" min="0" max="100" placeholder="90" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confidence">Confidence</Label>
                <Input id="confidence" type="number" min="0" max="100" placeholder="95" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/memories/skeleton-before-polish">Save draft preview</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/memories">Cancel</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>Good memory checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">It should be reusable across future sessions.</div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">It should be short enough to fit into context.</div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">It should include a clear type: rule, preference, decision or task.</div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Sensitive memory controls will be added later.</div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
