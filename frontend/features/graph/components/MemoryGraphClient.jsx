'use client';

import { useEffect, useMemo, useState } from 'react';
import { GitBranch, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const defaultLinkForm = {
  sourceMemoryId: '',
  targetMemoryId: '',
  relationshipType: 'related',
  weight: 0.7,
  reason: '',
};

const relationshipTypes = [
  'related',
  'supports',
  'contradicts',
  'depends_on',
  'duplicates',
  'same_project',
  'same_topic',
];

async function parseResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body;
}

function truncateLabel(label) {
  return label.length > 90 ? `${label.slice(0, 90)}...` : label;
}

export function MemoryGraphClient() {
  const [graph, setGraph] = useState({ nodes: [], edges: [], source: 'inferred' });
  const [selectedNode, setSelectedNode] = useState(null);
  const [linkForm, setLinkForm] = useState(defaultLinkForm);
  const [loading, setLoading] = useState(true);
  const [savingLink, setSavingLink] = useState(false);
  const [error, setError] = useState('');

  const targetOptions = useMemo(
    () => graph.nodes.filter((node) => node.id !== linkForm.sourceMemoryId),
    [graph.nodes, linkForm.sourceMemoryId],
  );

  async function loadGraph() {
    setLoading(true);
    setError('');
    try {
      const body = await parseResponse(await fetch('/api/graph'));
      const nextGraph = body.graph || { nodes: [], edges: [], source: 'inferred' };
      setGraph(nextGraph);

      if (selectedNode) {
        setSelectedNode(nextGraph.nodes.find((node) => node.id === selectedNode.id) || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load graph');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedEdges = selectedNode
    ? graph.edges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
    : [];

  async function createLink(event) {
    event.preventDefault();
    setError('');

    if (!linkForm.sourceMemoryId || !linkForm.targetMemoryId) {
      setError('Select source and target memories first.');
      return;
    }

    if (linkForm.sourceMemoryId === linkForm.targetMemoryId) {
      setError('Source and target must be different memories.');
      return;
    }

    setSavingLink(true);
    try {
      await parseResponse(await fetch('/api/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceMemoryId: linkForm.sourceMemoryId,
          targetMemoryId: linkForm.targetMemoryId,
          relationshipType: linkForm.relationshipType,
          weight: Number(linkForm.weight),
          reason: linkForm.reason || undefined,
        }),
      }));

      setLinkForm(defaultLinkForm);
      await loadGraph();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create memory link');
    } finally {
      setSavingLink(false);
    }
  }

  async function deleteLink(id) {
    setError('');
    try {
      await parseResponse(await fetch(`/api/graph?id=${encodeURIComponent(id)}`, { method: 'DELETE' }));
      await loadGraph();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete memory link');
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Nodes</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{graph.nodes.length}</CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Edges</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{graph.edges.length}</CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Source</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2 text-3xl font-bold capitalize">
            {graph.source || 'inferred'}
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle>Create memory link</CardTitle>
          <CardDescription>
            Manually persist a relationship into `memory_links`. Persisted links become the graph source immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createLink} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Select
                value={linkForm.sourceMemoryId}
                onValueChange={(value) => setLinkForm({ ...linkForm, sourceMemoryId: value, targetMemoryId: value === linkForm.targetMemoryId ? '' : linkForm.targetMemoryId })}
              >
                <SelectTrigger><SelectValue placeholder="Source memory" /></SelectTrigger>
                <SelectContent>
                  {graph.nodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>{truncateLabel(node.label)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={linkForm.targetMemoryId} onValueChange={(value) => setLinkForm({ ...linkForm, targetMemoryId: value })}>
                <SelectTrigger><SelectValue placeholder="Target memory" /></SelectTrigger>
                <SelectContent>
                  {targetOptions.map((node) => (
                    <SelectItem key={node.id} value={node.id}>{truncateLabel(node.label)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
              <Select value={linkForm.relationshipType} onValueChange={(value) => setLinkForm({ ...linkForm, relationshipType: value })}>
                <SelectTrigger><SelectValue placeholder="Relationship type" /></SelectTrigger>
                <SelectContent>
                  {relationshipTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={linkForm.weight}
                onChange={(event) => setLinkForm({ ...linkForm, weight: event.target.value })}
                placeholder="Weight"
              />
            </div>

            <Textarea
              value={linkForm.reason}
              onChange={(event) => setLinkForm({ ...linkForm, reason: event.target.value })}
              placeholder="Optional reason shown on the edge label"
              className="min-h-20"
            />

            <Button type="submit" disabled={savingLink || graph.nodes.length < 2}>
              {savingLink ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create link
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                  <GitBranch className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>Memory graph</CardTitle>
                    <Badge variant={graph.source === 'persisted' ? 'default' : 'secondary'}>
                      {graph.source === 'persisted' ? 'memory_links' : 'inferred fallback'}
                    </Badge>
                  </div>
                  <CardDescription>
                    Uses persisted memory_links when available, otherwise infers edges from type/shared tags.
                  </CardDescription>
                </div>
              </div>
              <Button variant="outline" onClick={loadGraph}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center gap-3 p-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading graph...
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {graph.nodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className="rounded-2xl border border-border/60 bg-background/60 p-4 text-left transition hover:border-primary/60"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <Badge variant="secondary">{node.type}</Badge>
                      <span className="text-xs text-muted-foreground">{Math.round(node.confidence * 100)}%</span>
                    </div>
                    <p className="line-clamp-4 text-sm text-muted-foreground">{node.label}</p>
                  </button>
                ))}
                {!graph.nodes.length && (
                  <div className="rounded-2xl border border-border/60 p-8 text-center text-muted-foreground md:col-span-2 xl:col-span-3">
                    No graph nodes yet. Create memories first.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>Node details</CardTitle>
            <CardDescription>Select a node to inspect relationships.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedNode ? (
              <>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <Badge variant="secondary" className="mb-3">{selectedNode.type}</Badge>
                  <p className="text-sm text-muted-foreground">{selectedNode.label}</p>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Related edges</div>
                  {selectedEdges.length ? selectedEdges.map((edge) => (
                    <div key={edge.id} className="rounded-xl border border-border/60 bg-background/60 p-3 text-sm text-muted-foreground">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-foreground">{edge.label}</div>
                          <div>Weight: {Math.round(edge.weight * 100)}%</div>
                        </div>
                        {graph.source === 'persisted' && (
                          <Button size="sm" variant="ghost" onClick={() => deleteLink(edge.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">No edges for this node yet.</p>}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No node selected.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
