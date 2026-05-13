'use client';

import { useEffect, useState } from 'react';
import { GitBranch, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

async function parseResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body;
}

export function MemoryGraphClient() {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadGraph() {
    setLoading(true);
    setError('');
    try {
      const body = await parseResponse(await fetch('/api/graph'));
      setGraph(body.graph || { nodes: [], edges: [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load graph');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGraph();
  }, []);

  const selectedEdges = selectedNode
    ? graph.edges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
    : [];

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
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Mode</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">MVP</CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                  <GitBranch className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Memory graph</CardTitle>
                  <CardDescription>Node/edge MVP generated from memory type and shared tags.</CardDescription>
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
            <CardDescription>Select a node to inspect its MVP relationships.</CardDescription>
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
                      <div className="font-medium text-foreground">{edge.label}</div>
                      <div>Weight: {Math.round(edge.weight * 100)}%</div>
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
