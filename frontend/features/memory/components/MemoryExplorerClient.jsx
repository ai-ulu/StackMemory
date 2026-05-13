'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
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

const memoryTypes = ['identity', 'preference', 'fact', 'project', 'rule', 'decision', 'task', 'insight'];
const scopes = ['private', 'team', 'org'];

const emptyForm = {
  content: '',
  type: 'fact',
  scope: 'private',
  confidence: 0.8,
  tags: '',
};

function normalizeTags(value) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function ConfidenceBar({ value }) {
  const percent = Math.round((value ?? 0) * 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Confidence</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function buildQuery(filters) {
  const params = new URLSearchParams();

  if (filters.query) params.set('q', filters.query);
  if (filters.type !== 'all') params.set('type', filters.type);
  if (filters.status !== 'all') params.set('status', filters.status);
  if (filters.scope !== 'all') params.set('scope', filters.scope);
  params.set('limit', '100');

  return params.toString();
}

async function parseResponse(response) {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || 'Request failed');
  }

  return body;
}

export function MemoryExplorerClient() {
  const [memories, setMemories] = useState([]);
  const [filters, setFilters] = useState({ query: '', type: 'all', status: 'all', scope: 'all' });
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const summary = useMemo(() => {
    const total = memories.length;
    const active = memories.filter((memory) => memory.status === 'active').length;
    const pending = memories.filter((memory) => memory.status === 'pending').length;
    const deprecated = memories.filter((memory) => memory.status === 'deprecated').length;
    const avgConfidence = total
      ? memories.reduce((sum, memory) => sum + (memory.confidence ?? 0), 0) / total
      : 0;

    return { total, active, pending, deprecated, avgConfidence };
  }, [memories]);

  async function loadMemories(nextFilters = filters) {
    setLoading(true);
    setError('');

    try {
      const query = buildQuery(nextFilters);
      const body = await parseResponse(await fetch(`/api/memories?${query}`));
      setMemories(body.memories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load memories');
      setMemories([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMemories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateFilter(key, value) {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);
    loadMemories(nextFilters);
  }

  function startEdit(memory) {
    setEditing(memory.id);
    setForm({
      content: memory.content,
      type: memory.type,
      scope: memory.scope,
      confidence: memory.confidence ?? 0.8,
      tags: (memory.tags || []).join(', '),
    });
  }

  function resetForm() {
    setEditing(null);
    setForm(emptyForm);
  }

  async function saveMemory(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        content: form.content,
        type: form.type,
        scope: form.scope,
        confidence: Number(form.confidence),
        tags: normalizeTags(form.tags),
      };

      const response = editing
        ? await fetch(`/api/memories/${editing}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/memories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      await parseResponse(response);
      resetForm();
      await loadMemories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save memory');
    } finally {
      setSaving(false);
    }
  }

  async function deprecateMemory(id) {
    setError('');

    try {
      await parseResponse(await fetch(`/api/memories/${id}`, { method: 'DELETE' }));
      await loadMemories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not deprecate memory');
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{summary.total}</CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{summary.active}</CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{summary.pending}</CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg Confidence</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{Math.round(summary.avgConfidence * 100)}%</CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle>{editing ? 'Edit memory' : 'Create memory'}</CardTitle>
          <CardDescription>Bu form `/api/memories` servis katmanına gider; MCP hâlâ parkta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveMemory} className="space-y-4">
            <Textarea
              value={form.content}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
              placeholder="Store a project rule, decision, task or insight..."
              className="min-h-28"
              required
            />
            <div className="grid gap-4 md:grid-cols-4">
              <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>{memoryTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.scope} onValueChange={(value) => setForm({ ...form, scope: value })}>
                <SelectTrigger><SelectValue placeholder="Scope" /></SelectTrigger>
                <SelectContent>{scopes.map((scope) => <SelectItem key={scope} value={scope}>{scope}</SelectItem>)}</SelectContent>
              </Select>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={form.confidence}
                onChange={(event) => setForm({ ...form, confidence: event.target.value })}
              />
              <Input
                value={form.tags}
                onChange={(event) => setForm({ ...form, tags: event.target.value })}
                placeholder="tags, comma, separated"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {editing ? 'Save changes' : 'Create memory'}
              </Button>
              {editing && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="mr-2 h-4 w-4" /> Cancel edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>API query parametreleriyle gerçek listeleme akışını test eder.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={filters.query}
              onChange={(event) => setFilters({ ...filters, query: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === 'Enter') loadMemories();
              }}
              placeholder="Search content"
              className="pl-9"
            />
          </div>
          <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all types</SelectItem>
              {memoryTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all status</SelectItem>
              <SelectItem value="active">active</SelectItem>
              <SelectItem value="pending">pending</SelectItem>
              <SelectItem value="deprecated">deprecated</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.scope} onValueChange={(value) => updateFilter('scope', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all scopes</SelectItem>
              {scopes.map((scope) => <SelectItem key={scope} value={scope}>{scope}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => loadMemories()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {loading && (
          <Card className="border-border/60 bg-card/60">
            <CardContent className="flex items-center justify-center gap-3 p-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading memories...
            </CardContent>
          </Card>
        )}

        {!loading && memories.map((memory) => (
          <Card key={memory.id} className="border-border/60 bg-card/60">
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{memory.type}</Badge>
                    <Badge variant="outline">{memory.status}</Badge>
                    <Badge variant="outline">{memory.scope}</Badge>
                  </div>
                  <CardTitle className="text-lg leading-7">{memory.content}</CardTitle>
                </div>
                <div className="min-w-44">
                  <ConfidenceBar value={memory.confidence} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(memory.tags || []).map((tag) => (
                  <span key={tag} className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                    #{tag}
                  </span>
                ))}
                {(!memory.tags || memory.tags.length === 0) && (
                  <span className="text-xs text-muted-foreground">No tags stored yet</span>
                )}
              </div>
              <div className="flex flex-col justify-between gap-4 text-xs text-muted-foreground md:flex-row md:items-center">
                <div className="grid gap-2 md:grid-cols-3">
                  <div>Access count: {memory.accessCount ?? 0}</div>
                  <div>Decay: {Math.round((memory.decayFactor ?? 1) * 100)}%</div>
                  <div>Updated: {memory.updatedAt ? new Date(memory.updatedAt).toLocaleDateString('tr-TR') : '-'}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(memory)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deprecateMemory(memory.id)} disabled={memory.status === 'deprecated'}>
                    <Trash2 className="mr-2 h-4 w-4" /> Deprecate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && memories.length === 0 && (
          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-8 text-center text-muted-foreground">
              No memories yet. Create the first memory above.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
