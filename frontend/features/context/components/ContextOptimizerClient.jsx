'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Calculator, Loader2, RefreshCw, Sparkles } from 'lucide-react';
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

const defaultForm = {
  agentId: 'coding-agent',
  workspaceId: 'stackmemory',
  userRequest: 'Continue the current product work. Use only relevant active memories and avoid sending repeated context.',
  maxContextTokens: 6000,
  strategy: 'balanced',
  tag: '',
};

const emptySummary = {
  totals: {
    contextBuilds: 0,
    usageEvents: 0,
    finalContextTokens: 0,
    estimatedSavedTokens: 0,
    estimatedBaselineTokens: 0,
    savingsPercent: 0,
    selectedMemoryCount: 0,
    omittedMemoryCount: 0,
    inputTokens: 0,
    outputTokens: 0,
    cachedInputTokens: 0,
    estimatedCostUsd: 0,
    avgFinalContextTokens: 0,
    avgSavedTokens: 0,
  },
  agentBreakdown: [],
  recentBuilds: [],
};

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value || 0);
}

async function parseResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body;
}

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function ContextOptimizerClient() {
  const [form, setForm] = useState(defaultForm);
  const [summary, setSummary] = useState(emptySummary);
  const [result, setResult] = useState(null);
  const [compiledContext, setCompiledContext] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  async function loadSummary() {
    setLoadingSummary(true);
    setError('');

    try {
      const body = await parseResponse(await fetch('/api/usage/summary'));
      setSummary(body.summary || emptySummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load usage summary');
      setSummary(emptySummary);
    } finally {
      setLoadingSummary(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  function getPayload() {
    return {
      agentId: form.agentId,
      workspaceId: form.workspaceId,
      userRequest: form.userRequest,
      maxContextTokens: Number(form.maxContextTokens),
      strategy: form.strategy,
      filters: {
        tag: form.tag || undefined,
        status: 'active',
      },
    };
  }

  async function runEstimate() {
    setRunning(true);
    setError('');
    setCompiledContext('');

    try {
      const body = await parseResponse(await fetch('/api/context/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getPayload()),
      }));
      setResult({ mode: 'estimate', ...body });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not estimate context');
    } finally {
      setRunning(false);
    }
  }

  async function runCompile() {
    setRunning(true);
    setError('');

    try {
      const body = await parseResponse(await fetch('/api/context/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getPayload()),
      }));
      setResult({ mode: 'compile', ...body });
      setCompiledContext(body.context || '');
      await loadSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not compile context');
    } finally {
      setRunning(false);
    }
  }

  const totals = summary.totals || emptySummary.totals;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Estimated Savings"
          value={`${totals.savingsPercent || 0}%`}
          description={`${formatNumber(totals.estimatedSavedTokens)} estimated saved tokens`}
          icon={Sparkles}
        />
        <StatCard
          title="Context Builds"
          value={formatNumber(totals.contextBuilds)}
          description="Compiled context telemetry events"
          icon={BarChart3}
        />
        <StatCard
          title="Avg Final Context"
          value={formatNumber(totals.avgFinalContextTokens)}
          description="Average tokens after optimization"
          icon={Calculator}
        />
        <StatCard
          title="Avg Saved"
          value={formatNumber(totals.avgSavedTokens)}
          description="Average saved tokens per compile"
          icon={Sparkles}
        />
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle>Context optimizer test panel</CardTitle>
          <CardDescription>
            Estimate or compile a request under a token budget. Compile also records telemetry for the savings dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input value={form.agentId} onChange={(event) => setForm({ ...form, agentId: event.target.value })} placeholder="agentId" />
            <Input value={form.workspaceId} onChange={(event) => setForm({ ...form, workspaceId: event.target.value })} placeholder="workspaceId" />
          </div>
          <Textarea
            value={form.userRequest}
            onChange={(event) => setForm({ ...form, userRequest: event.target.value })}
            className="min-h-28"
            placeholder="User request to compile context for..."
          />
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              type="number"
              min="1000"
              step="500"
              value={form.maxContextTokens}
              onChange={(event) => setForm({ ...form, maxContextTokens: event.target.value })}
              placeholder="Max context tokens"
            />
            <Select value={form.strategy} onValueChange={(value) => setForm({ ...form, strategy: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aggressive">aggressive</SelectItem>
                <SelectItem value="balanced">balanced</SelectItem>
                <SelectItem value="quality">quality</SelectItem>
              </SelectContent>
            </Select>
            <Input value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })} placeholder="Optional tag filter" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={runEstimate} disabled={running || !form.userRequest} variant="outline">
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
              Estimate
            </Button>
            <Button onClick={runCompile} disabled={running || !form.userRequest}>
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Compile + record
            </Button>
            <Button onClick={loadSummary} disabled={loadingSummary} variant="ghost">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh summary
            </Button>
          </div>
        </CardContent>
      </Card>

      {result?.metrics && (
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Latest {result.mode}</CardTitle>
                <CardDescription>Context budget result for the current request.</CardDescription>
              </div>
              <Badge variant="secondary">{result.metrics.strategy}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Final Context" value={formatNumber(result.metrics.finalContextTokens)} description="Estimated final prompt tokens" icon={Calculator} />
            <StatCard title="Saved Tokens" value={formatNumber(result.metrics.estimatedSavingsTokens)} description={`${result.metrics.estimatedSavingsPercent}% estimated reduction`} icon={Sparkles} />
            <StatCard title="Selected Memories" value={formatNumber(result.metrics.selectedMemoryCount)} description="Included within budget" icon={BarChart3} />
            <StatCard title="Omitted Memories" value={formatNumber(result.metrics.omittedMemoryCount)} description="Skipped by budget rules" icon={BarChart3} />
          </CardContent>
        </Card>
      )}

      {compiledContext && (
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>Compiled context preview</CardTitle>
            <CardDescription>This is the optimized block an agent can send to the model.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto rounded-2xl border border-border/60 bg-background/80 p-4 text-xs leading-5 text-muted-foreground">
              {compiledContext}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle>Agent savings leaderboard</CardTitle>
          <CardDescription>Top agents by estimated saved tokens from context builds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.agentBreakdown?.length ? summary.agentBreakdown.map((agent) => (
            <div key={agent.agentId} className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{agent.agentId}</div>
                <Badge variant="secondary">{agent.savingsPercent}% saved</Badge>
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-4">
                <div>Builds: {formatNumber(agent.builds)}</div>
                <div>Final: {formatNumber(agent.finalContextTokens)}</div>
                <div>Saved: {formatNumber(agent.estimatedSavedTokens)}</div>
                <div>Omitted memories: {formatNumber(agent.omittedMemoryCount)}</div>
              </div>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-8 text-center text-sm text-muted-foreground">
              No context builds recorded yet. Use Compile + record above.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle>Recent context builds</CardTitle>
          <CardDescription>Latest compile telemetry stored in Supabase.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.recentBuilds?.length ? summary.recentBuilds.map((build) => (
            <div key={build.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{build.agentId}</div>
                <div className="flex gap-2">
                  <Badge variant="outline">{build.strategy}</Badge>
                  <Badge variant="secondary">{build.savingsPercent}% saved</Badge>
                </div>
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-4">
                <div>Final: {formatNumber(build.finalContextTokens)}</div>
                <div>Saved: {formatNumber(build.estimatedSavedTokens)}</div>
                <div>Selected: {formatNumber(build.selectedMemoryCount)}</div>
                <div>Omitted: {formatNumber(build.omittedMemoryCount)}</div>
              </div>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-8 text-center text-sm text-muted-foreground">
              No recent builds yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
