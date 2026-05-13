'use client';

import { useEffect, useState } from 'react';
import { Brain, Loader2, Play, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

async function parseResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body;
}

function ScoreCard({ label, value, description }) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}%</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function BrainDashboardClient() {
  const [status, setStatus] = useState(null);
  const [decision, setDecision] = useState('Should we keep MCP parked until the app service layer is stable?');
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState('');

  async function loadStatus() {
    setLoading(true);
    setError('');
    try {
      const body = await parseResponse(await fetch('/api/brain/status'));
      setStatus(body.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load brain status');
    } finally {
      setLoading(false);
    }
  }

  async function runSimulation() {
    setSimulating(true);
    setError('');
    try {
      const body = await parseResponse(await fetch('/api/brain/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      }));
      setSimulation(body.simulation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not simulate decision');
    } finally {
      setSimulating(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  if (loading) {
    return (
      <Card className="border-border/60 bg-card/60">
        <CardContent className="flex items-center justify-center gap-3 p-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading brain status...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {status && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <ScoreCard label="Brain Health" value={status.healthScore} description="Combined active, fresh and confident memory signal." />
            <ScoreCard label="Freshness" value={status.freshnessScore} description="How recently the memory layer changed." />
            <ScoreCard label="Confidence" value={status.confidenceScore} description="Average trust score of stored memory." />
            <ScoreCard label="Cognitive Load" value={status.cognitiveLoad} description="Memory density pressure for the workspace." />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <Card className="border-border/60 bg-card/60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Brain signals</CardTitle>
                    <CardDescription>MVP scoring runs over the app memory service.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {status.signals.map((signal) => (
                  <div key={signal.label} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                    <div className="mb-2 flex justify-between text-sm font-medium">
                      <span>{signal.label}</span>
                      <span>{signal.value}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{signal.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                    <ShieldAlert className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Risks</CardTitle>
                    <CardDescription>Simple heuristics until deeper consolidation lands.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {status.risks.length ? status.risks.map((risk) => (
                  <div key={risk.title} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                    <Badge variant="outline" className="mb-2">{risk.level}</Badge>
                    <div className="font-medium">{risk.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{risk.description}</p>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">No major risks detected in this MVP pass.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Decision Simulator</CardTitle>
              <CardDescription>Scores a decision against currently stored memories.</CardDescription>
            </div>
            <Button variant="outline" onClick={loadStatus}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea value={decision} onChange={(event) => setDecision(event.target.value)} className="min-h-24" />
          <Button onClick={runSimulation} disabled={simulating || !decision.trim()}>
            {simulating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Simulate decision
          </Button>

          {simulation && (
            <div className="space-y-4 rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">Score: {simulation.score}%</div>
                  <p className="text-sm text-muted-foreground">{simulation.recommendation}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Supporting memories</div>
                {simulation.supportingMemories.length ? simulation.supportingMemories.map((memory) => (
                  <div key={memory.id} className="rounded-xl border border-border/60 p-3 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="mb-2">{memory.type}</Badge>
                    <p>{memory.content}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No strong supporting memories found.</p>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
