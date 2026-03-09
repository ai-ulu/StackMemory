// @ts-nocheck
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Brain, ArrowLeft, Loader2, Network, Shield, Activity, Clock, Sparkles, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, formatRelativeTime } from '@/lib/utils';

const TYPE_CONFIG = {
  project: {
    label: 'Project Context',
    icon: Network,
    color: 'text-cyan-500',
    panel: 'border-cyan-500/20 bg-cyan-500/5',
    description: 'Repo scope, stack, environment and workflow context.',
  },
  rule: {
    label: 'Rules',
    icon: Shield,
    color: 'text-amber-500',
    panel: 'border-amber-500/20 bg-amber-500/5',
    description: 'Coding standards, prompts, constraints and team conventions.',
  },
  decision: {
    label: 'Decisions',
    icon: Activity,
    color: 'text-violet-500',
    panel: 'border-violet-500/20 bg-violet-500/5',
    description: 'Architecture choices, tradeoffs and resolved direction.',
  },
  task: {
    label: 'Active Tasks',
    icon: Clock,
    color: 'text-orange-500',
    panel: 'border-orange-500/20 bg-orange-500/5',
    description: 'In-progress work, handoffs and next steps.',
  },
  preference: {
    label: 'Preferences',
    icon: Sparkles,
    color: 'text-pink-500',
    panel: 'border-pink-500/20 bg-pink-500/5',
    description: 'Personal coding style and output preferences.',
  },
  fact: {
    label: 'Facts',
    icon: Database,
    color: 'text-emerald-500',
    panel: 'border-emerald-500/20 bg-emerald-500/5',
    description: 'Reference information captured from your workflow.',
  },
};

function MemoryTypeCard({ type, count, total }) {
  const config = TYPE_CONFIG[type] || {
    label: type,
    icon: Brain,
    color: 'text-muted-foreground',
    panel: 'border-border bg-card',
    description: 'Stored context.',
  };
  const Icon = config.icon;
  const percentage = total ? Math.round((count / total) * 100) : 0;

  return (
    <Card className={cn('border', config.panel)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={cn('h-4 w-4', config.color)} />
          {config.label}
        </CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-3xl font-semibold">{count}</span>
          <Badge variant="outline">{percentage}%</Badge>
        </div>
        <Progress value={percentage} className="h-2" />
      </CardContent>
    </Card>
  );
}

function MemoryRow({ memory }) {
  const config = TYPE_CONFIG[memory.type] || TYPE_CONFIG.fact;
  const Icon = config.icon;
  const confidence = Math.round((memory.confidence || 0) * 100);

  return (
    <div className="rounded-xl border border-border/70 bg-card/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className={cn('mt-0.5 rounded-lg p-2', config.panel)}>
            <Icon className={cn('h-4 w-4', config.color)} />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{config.label}</Badge>
              <Badge variant="outline">{memory.scope || 'private'}</Badge>
              {memory.write_source ? (
                <Badge variant="outline">{memory.write_source}</Badge>
              ) : null}
            </div>
            <p className="text-sm leading-6 text-foreground">{memory.content}</p>
          </div>
        </div>
        <div className="shrink-0 text-right text-xs text-muted-foreground">
          <div>{formatRelativeTime(memory.updated_at || memory.created_at)}</div>
          <div className="mt-2 font-medium text-foreground">{confidence}% confidence</div>
        </div>
      </div>
    </div>
  );
}

export default function MemoryDashboard() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const loadMemories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/memories');
        if (!response.ok) {
          throw new Error('Failed to load memories');
        }
        const data = await response.json();
        setMemories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Memory dashboard load error:', error);
        setMemories([]);
      } finally {
        setLoading(false);
      }
    };

    loadMemories();
  }, []);

  const typeEntries = useMemo(() => {
    return Object.keys(TYPE_CONFIG)
      .map((type) => ({
        type,
        count: memories.filter((memory) => memory.type === type).length,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [memories]);

  const filteredMemories = useMemo(() => {
    return memories.filter((memory) => {
      const matchesType = filter === 'all' || memory.type === filter;
      const matchesQuery =
        !query.trim() ||
        memory.content.toLowerCase().includes(query.toLowerCase()) ||
        (memory.write_source || '').toLowerCase().includes(query.toLowerCase());
      return matchesType && matchesQuery;
    });
  }, [filter, memories, query]);

  const starterMemories = useMemo(() => {
    return memories.filter((memory) => memory.write_source === 'setup_wizard').length;
  }, [memories]);

  const averageConfidence = useMemo(() => {
    if (!memories.length) return 0;
    return Math.round(
      (memories.reduce((sum, memory) => sum + (memory.confidence || 0), 0) / memories.length) * 100
    );
  }, [memories]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to chat
          </Link>
          <div className="flex items-center gap-2 font-semibold">
            <Brain className="h-5 w-5 text-primary" />
            StackMemory
          </div>
        </div>
      </div>

      <div className="container space-y-8 py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge variant="outline">Developer Memory Layer</Badge>
            <h1 className="text-3xl font-bold tracking-tight">Project memory control center</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Inspect the shared context behind your Claude Code, Cursor, Codex, Replit and custom
              AI workflows. This is the layer that keeps project rules, decisions and active tasks reusable.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/settings">Open settings</Link>
            </Button>
            <Button asChild>
              <Link href="/chat">Capture more memory</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total memories</CardDescription>
              <CardTitle className="text-3xl">{memories.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Starter memories</CardDescription>
              <CardTitle className="text-3xl">{starterMemories}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Average confidence</CardDescription>
              <CardTitle className="text-3xl">{averageConfidence}%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {typeEntries.length > 0 ? (
            typeEntries.map((entry) => (
              <MemoryTypeCard key={entry.type} type={entry.type} count={entry.count} total={memories.length} />
            ))
          ) : (
            <Card className="lg:col-span-2 xl:col-span-3">
              <CardHeader>
                <CardTitle>No developer memory yet</CardTitle>
                <CardDescription>
                  Start with the setup wizard in chat to create project, rule and preference memories.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Memory inventory</CardTitle>
              <CardDescription>
                Filter by memory type and inspect what your workflow is actually storing.
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search memory content or source"
                className="sm:w-72"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                {Object.entries(TYPE_CONFIG).map(([type, config]) => (
                  <Button
                    key={type}
                    variant={filter === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(type)}
                  >
                    {config.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredMemories.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center">
                <Brain className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-medium">No memories match this view</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Change the type filter or capture a new workflow memory from chat.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[560px] pr-4">
                <div className="space-y-3">
                  {filteredMemories.map((memory) => (
                    <MemoryRow key={memory.id} memory={memory} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
