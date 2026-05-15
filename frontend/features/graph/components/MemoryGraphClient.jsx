'use client';

import { useEffect, useMemo, useState } from 'react';
import { Filter, GitBranch, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
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

const defaultFilters = {
  query: '',
  type: 'all',
  status: 'active',
  scope: 'all',
  tag: '',
  limit: 200,
};

const memoryTypes = [
  'all',
  'identity',
  'preference',
  'fact',
  'project',
  'rule',
  'decision',
  'task',
  'insight',
];

const memoryStatuses = ['all', 'active', 'pending', 'deprecated'];
const memoryScopes = ['all', 'private', 'team', 'org'];

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

function buildGraphQuery(filters) {
  const params = new URLSearchParams();
  if (filters.type && filters.type !== 'all') params.set('type', filters.type);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.scope && filters.scope !== 'all') params.set('scope', filters.scope);
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.limit) params.set('limit', String(filters.limit));
  const query = params.toString();
  return query ? `/api/graph?${query}` : '/api/graph';
}

export function MemoryGraphClient() {
  const [graph, setGraph] = useState({ nodes: [], edges: [], source: 'inferred' });
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedNode, setSelectedNode] = useState(null);
  const [linkForm, setLinkForm] = useState(defaultLinkForm);
  const [loading, setLoading] = useState(true);
  const [savingLink, setSavingLink] = useState(false);
  const [error, setError] = useState('');

  const visibleNodes = useMemo(() => {
    const term = filters.query.trim().toLowerCase();
    if (!term) return graph.nodes;

    return graph.nodes.filter((node) => {
      const searchable = [node.label, node.type, node.id].join(' ').toLowerCase();
      return searchable.includes(term);
    });
  }, [filters.query, graph.nodes]);

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((node) => node.id)),
    [visibleNodes],
  );

  const visibleEdges = useMemo(
    () => graph.edges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)),
    [graph.edges, visibleNodeIds],
  );

  const targetOptions = useMemo(
    () => graph.nodes.filter((node) => node.id !== linkForm.sourceMemoryId),
    [graph.nodes, linkForm.sourceMemoryId],
  );

  async function loadGraph(nextFilters = filters) {
    setLoading(true);
    setError('');
    try {
      const body = await parseResponse(await fetch(buildGraphQuery(nextFilters)));
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
    loadGraph(defaultFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedEdges = selectedNode
    ? visibleEdges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
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
      await loadGraph(filters);
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
      await loadGraph(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete memory link');
    }
  }

  async function applyFilters(event) {
    event.preventDefault();
    await loadGraph(filters);
  }

  async function resetFilters() {
    setFilters(defaultFilters);
    await loadGraph(defaultFilters);
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Nodes</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{visibleNodes.length}</div>
            {visibleNodes.length !== graph.nodes.length && (
              <p className="mt-1 text-xs text-muted-foreground">Filtered from {graph.nodes.length}</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Edges</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{visibleEdges.length}</div>
            {visibleEdges.length !== graph.edges.length && (
              <p className="mt-1 text-xs text-muted-foreground">Filtered from {graph.edges.length}</p>
            )}
          </CardContent>
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
          <CardTitle>Graph filters</CardTitle>
          <CardDescription>
            Narrow the graph by memory type, status, scope, tag, limit, or local text search before creating links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={applyFilters} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <Input
                value={filters.query}
                onChange={(event) => setFilters({ ...filters, query: event.target.value })}
                placeholder="Search visible nodes"
              />
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  {memoryTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {memoryStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.scope} onValueChange={(value) => setFilters({ ...filters, scope: value })}>
                <SelectTrigger><SelectValue placeholder="Scope" /></SelectTrigger>
                <SelectContent>
                  {memoryScopes.map((scope) => <SelectItem key={scope} value={scope}>{scope}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input value={filters.tag} onChange={(event) => setFilters({ ...filters, tag: event.target.value })} placeholder="Tag" />
              <Input
                type="number"
                min="10"
                max="500"
                step="10"
                value={filters.limit}
                onChange={(event) => setFilters({ ...filters, limit: Number(event.target.value) })}
                placeholder="Limit"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}
                Apply filters
              </Button>
              <Button type="button" variant="outline" onClick={resetFilters} disabled={loading}>
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
              <Button variant="outline" onClick={() => loadGraph(filters)}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center gap-3 p-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading graph...
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleNodes.map((node) => (
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
                {!visibleNodes.length && (
                  <div className="rounded-2xl border border-border/60 p-8 text-center text-muted-foreground md:col-span-2 xl:col-span-3">
                    No graph nodes match the current filters.
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
                  )) : <p className="text-sm text-muted-foreground">No visible edges for this node under the current filters.</p>}
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
