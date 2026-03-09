'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight,
  Brain,
  Braces,
  Check,
  Code2,
  Database,
  GitBranch,
  Lock,
  Network,
  Search,
  Terminal,
  Wrench,
} from 'lucide-react';

function InfoCard({ icon: Icon, title, children }) {
  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur">
      <CardHeader>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}

const workflowTargets = [
  {
    key: 'claude_code',
    name: 'Claude Code',
    desc: 'Repo kurallari, aktif TODOlar ve karar gecmisini tekrar anlatmadan surdur.',
  },
  {
    key: 'cursor',
    name: 'Cursor',
    desc: 'Ayni proje tercihlerini editor icinde ve chat oturumlarinda paylas.',
  },
  {
    key: 'codex',
    name: 'Codex',
    desc: 'Tekrar eden prompt yerine kalici project context ve rule set kullan.',
  },
  {
    key: 'replit',
    name: 'Replit',
    desc: 'Cloud IDE ve agent akislarinda ayni hafizayi koru.',
  },
  {
    key: 'custom_app',
    name: 'Bolt / Lovable',
    desc: 'Hizli urun prototiplemede teknik kararlarini ve stack tercihlerini tasi.',
  },
  {
    key: 'custom_app',
    name: 'Custom App / n8n',
    desc: 'API, MCP veya bridge ile kendi agent pipelineina memory backend ekle.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-violet-600 to-cyan-500">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold">StackMemory</div>
              <div className="text-xs text-muted-foreground">Shared Memory For AI Coding Workflows</div>
            </div>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
            <a href="#usage" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Use Cases</a>
            <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="border-b border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.12),transparent_30%)]">
        <div className="container py-20 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-8">
              <Badge variant="outline" className="rounded-full px-4 py-1">
                For Claude Code, Cursor, Codex-style agents, VS Code workflows, Bolt, Lovable, Replit, and custom AI apps
              </Badge>

              <div className="space-y-5">
                <h1 className="max-w-4xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  One memory layer for your
                  {' '}
                  <span className="bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent">
                    AI coding stack
                  </span>
                  .
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                  StackMemory keeps project context, coding preferences, architecture decisions, and active tasks portable across AI tools.
                  Use it as your own memory workspace or embed it into the AI products you build.
                </p>
                <div className="rounded-2xl border border-border/60 bg-card/50 p-4 text-sm text-muted-foreground">
                  Start by storing:
                  {' '}project rules, preferred stack, code review preferences, current tasks, architecture decisions, and reusable prompts for your agents.
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href="/signup?workflow=claude_code">
                  <Button size="lg" className="rounded-xl px-8">
                    Start Capturing Project Context
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="rounded-xl px-8">
                    See Pricing
                  </Button>
                </Link>
              </div>

              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                {[
                  'Keep the same context across multiple AI tools',
                  'Stop repeating project rules and preferences',
                  'Connect memory via MCP, API, bridge, or SDK',
                  'Use as a developer tool or memory backend',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {workflowTargets.map((target) => (
                  <Link
                    key={target.name}
                    href={`/signup?workflow=${target.key}`}
                    className="rounded-2xl border border-border/60 bg-card/40 p-4 text-sm transition-colors hover:border-primary/40 hover:bg-card/70"
                  >
                    <div className="mb-2 font-medium">{target.name}</div>
                    <div className="text-muted-foreground">{target.desc}</div>
                  </Link>
                ))}
              </div>
            </div>

            <Card className="border-border/60 bg-card/60 p-2 shadow-2xl">
              <CardContent className="space-y-4 p-6">
                <div className="mb-2 text-sm font-medium text-muted-foreground">Example shared project context</div>
                {[
                  ['Project', 'memory layer for AI coding workflows'],
                  ['Stack', 'Next.js, FastAPI, MCP, API bridge'],
                  ['Preferences', 'TypeScript, clean diffs, API-first design'],
                  ['Decisions', 'MCP is the primary integration surface'],
                  ['Current task', 'stabilize auth, memory UX, and positioning'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-border/50 bg-background/70 p-4">
                    <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
                    <div className="text-sm">{value}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="container space-y-12">
          <div className="max-w-2xl space-y-4">
            <Badge variant="secondary">Core Product</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">Built for AI-native development workflows</h2>
            <p className="text-lg text-muted-foreground">
              StackMemory is not a generic chat app. It is a shared memory system for coding tools, agents, and developer workflows that need durable project context.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard icon={Search} title="Recall project context">
              Retrieve constraints, past decisions, and active work without re-explaining them in every tool.
            </InfoCard>
            <InfoCard icon={Code2} title="Keep coding preferences portable">
              Store style preferences, stack choices, and recurring instructions once and reuse them across sessions.
            </InfoCard>
            <InfoCard icon={Network} title="Connect multiple surfaces">
              Use MCP, REST, WebSocket, and SDK integrations to expose the same memory to multiple AI environments.
            </InfoCard>
            <InfoCard icon={Lock} title="Control what gets remembered">
              A serious memory product must make stored context inspectable, editable, exportable, and deletable.
            </InfoCard>
          </div>
        </div>
      </section>

      <section id="usage" className="border-y border-border/60 bg-muted/30 py-20">
        <div className="container grid gap-6 lg:grid-cols-3">
          <InfoCard icon={Terminal} title="For tool users">
            Claude Code, Claude Desktop, Cursor, VS Code workflows, Bolt, Lovable, Replit, and other AI-heavy coding environments can pull from the same project memory when integration surfaces allow it.
          </InfoCard>
          <InfoCard icon={Braces} title="For builders">
            If you are building your own AI app, internal copilot, or agent workflow, StackMemory can act as the memory backend behind your product from day one.
          </InfoCard>
          <InfoCard icon={GitBranch} title="For teams">
            Teams can use the same foundation for project-scoped context, shared instructions, and reusable developer memory over time.
          </InfoCard>
        </div>
      </section>

      <section className="py-20">
        <div className="container grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5">
            <Badge variant="outline">Integration Surfaces</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">Use StackMemory as a product or as infrastructure</h2>
            <p className="text-lg leading-8 text-muted-foreground">
              The same core can power your personal workflow and the AI products you build.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              { icon: Database, title: 'Memory workspace', desc: 'Inspect and manage stored project context in the app.' },
              { icon: Network, title: 'REST + WebSocket bridge', desc: 'Expose memory to agents, apps, and real-time workflows.' },
              { icon: Terminal, title: 'MCP server', desc: 'Connect memory to compatible AI coding clients.' },
              { icon: Wrench, title: 'SDK and integration path', desc: 'Embed memory into custom AI systems and internal tooling.' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card/50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-muted-foreground">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/20 py-20">
        <div className="container space-y-10">
          <div className="max-w-2xl space-y-4">
            <Badge variant="secondary">Quick Starts</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">Choose your workflow and start with the right memory shape</h2>
            <p className="text-lg text-muted-foreground">
              Different tools need different starter context. StackMemory should feel opinionated on day one, not empty.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                key: 'claude_code',
                title: 'Claude Code handoff',
                points: ['architecture decisions', 'repo rules', 'active tasks'],
              },
              {
                key: 'cursor',
                title: 'Cursor workspace memory',
                points: ['coding style', 'preferred stack', 'review constraints'],
              },
              {
                key: 'codex',
                title: 'Codex / agent prompt base',
                points: ['persistent system context', 'project assumptions', 'allowed actions'],
              },
              {
                key: 'replit',
                title: 'Replit / cloud IDE memory',
                points: ['deployment notes', 'runtime limits', 'shared project facts'],
              },
              {
                key: 'custom_app',
                title: 'Bolt / Lovable build loop',
                points: ['product rules', 'UI constraints', 'iteration history'],
              },
              {
                key: 'custom_app',
                title: 'Custom app / n8n pipeline',
                points: ['API memory writes', 'query policies', 'workflow recall'],
              },
            ].map((item) => (
              <Link key={item.title} href={`/signup?workflow=${item.key}`}>
              <Card className="border-border/60 bg-card/60 transition-colors hover:border-primary/40 hover:bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {item.points.map((point) => (
                    <div key={point} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span>{point}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 py-20">
        <div className="container text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Stop re-explaining your project to every AI tool</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Start with one shared memory layer for your workflow, then use the same core inside the AI applications you build.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/signup?workflow=claude_code">
              <Button size="lg" className="rounded-xl px-8">Get Started</Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="rounded-xl px-8">Pricing</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
