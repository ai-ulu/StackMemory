import Link from 'next/link';
import { deleteMemoryAction, updateMemoryAction } from '@/app/memories/actions';
import { AppShell } from '@/components/app/AppShell';
import { getMemory } from '@/lib/memories/service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const memoryTypes = ['rule', 'preference', 'decision', 'task', 'note'];

function statusMessage(status) {
  if (status === 'updated') return 'Memory updated through the MCP backend.';
  return null;
}

function errorMessage(error) {
  if (error === 'missing-content') return 'Memory content is required.';
  if (error === 'update-failed') return 'Memory could not be updated through the MCP backend.';
  if (error === 'delete-failed') return 'Memory could not be deleted through the MCP backend.';
  return null;
}

export default async function MemoryDetailPage({ params, searchParams }) {
  const memory = await getMemory(params.id);
  const status = statusMessage(searchParams?.status);
  const error = errorMessage(searchParams?.error);

  return (
    <AppShell title="Memory Detail" description="Inspect one memory, its metadata and future retrieval signals.">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/memories">Back to memories</Link>
          </Button>
          <Button asChild>
            <Link href={`/brain?memory=${params.id}`}>Preview in Brain</Link>
          </Button>
        </div>

        {status && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700">
            {status}
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>Memory ID: {params.id}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            {memory ? (
              <>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4 text-foreground">
                  {memory.content}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Type: {memory.type}</div>
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Source: {memory.source}</div>
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Confidence: {Math.round(memory.confidence * 100)}%</div>
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Importance: {Math.round(memory.importance * 100)}%</div>
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Decay: {Math.round(memory.decay * 100)}%</div>
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4">Retrieval: MCP-backed preview</div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                Memory not found. This route is ready for real API-backed records.
              </div>
            )}

            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              Future view: related memories, graph edges and context compiler impact.
            </div>
          </CardContent>
        </Card>

        {memory && (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.65fr]">
            <Card className="border-border/60 bg-card/60">
              <CardHeader>
                <CardTitle>Edit memory</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={updateMemoryAction} className="space-y-5">
                  <input type="hidden" name="id" value={memory.id} />

                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <select id="type" name="type" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" defaultValue={memory.type}>
                      {memoryTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea id="content" name="content" rows={5} defaultValue={memory.content} required />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="source">Source</Label>
                      <Input id="source" name="source" defaultValue={memory.source} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confidence">Confidence</Label>
                      <Input id="confidence" name="confidence" type="number" min="0" max="100" defaultValue={Math.round(memory.confidence * 100)} />
                    </div>
                  </div>

                  <Button type="submit">Update memory</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-destructive/30 bg-card/60">
              <CardHeader>
                <CardTitle>Danger zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>Delete removes this memory through the MCP backend. This should later require a confirmation modal.</p>
                <form action={deleteMemoryAction}>
                  <input type="hidden" name="id" value={memory.id} />
                  <Button type="submit" variant="destructive" className="w-full">
                    Delete memory
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
