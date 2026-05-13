'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoCard } from '@/components/landing/InfoCard';
import {
  builderQuickStarts,
  demoScenarios,
  developerMemoryPack,
  heroBenefits,
  integrationSurfaces,
  proofPoints,
  quickStartWorkflows,
  workflowTargets,
} from '@/content/landing';
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

const integrationIconMap = {
  Database,
  Network,
  Terminal,
  Wrench,
};

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
                  Stop re-explaining your project to every
                  {' '}
                  <span className="bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent">
                    AI coding tool
                  </span>
                  .
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                  StackMemory gives Claude Code, Cursor, Codex-style agents, Replit, Bolt, Lovable, and your own AI apps
                  one shared memory layer for project context, coding preferences, architecture decisions, and active tasks.
                </p>
                <div className="rounded-2xl border border-border/60 bg-card/50 p-4 text-sm text-muted-foreground">
                  Use it in two ways:
                  {' '}as your personal memory workspace across multiple AI coding tools, or as the memory backend inside the AI products and automations you build.
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href="/signup?workflow=claude_code">
                  <Button size="lg" className="rounded-xl px-8">
                    Start with a developer workflow
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/integrations">
                  <Button size="lg" variant="outline" className="rounded-xl px-8">
                    Open builder guide
                  </Button>
                </Link>
              </div>

              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                {heroBenefits.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 rounded-3xl border border-border/60 bg-card/40 p-5">
                <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Why this wins over built-in tool memory
                </div>
                {proofPoints.map((item) => (
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
                <div className="mb-2 text-sm font-medium text-muted-foreground">Example developer memory pack</div>
                {developerMemoryPack.map(([label, value]) => (
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

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-border/60 bg-card/50">
              <CardHeader>
                <CardTitle>Why now</CardTitle>
                <CardDescription>AI usage keeps increasing, but context still resets between tools.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                The more AI tools your team uses, the more expensive repeated context becomes. Shared memory becomes workflow infrastructure, not a nice-to-have.
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/50">
              <CardHeader>
                <CardTitle>Why built-in memory falls short</CardTitle>
                <CardDescription>Most tool memory is isolated to a single product.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                Chat history is not shared project memory. StackMemory keeps context inspectable, reusable, and portable across coding tools, agents, and custom apps.
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/50">
              <CardHeader>
                <CardTitle>Why StackMemory</CardTitle>
                <CardDescription>One memory system for users and builders.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                Use the app to manage memory directly, or use MCP, bridge and APIs to make the same memory available inside your own AI workflows.
              </CardContent>
            </Card>
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
            {integrationSurfaces.map((item) => {
              const Icon = integrationIconMap[item.icon] || Database;

              return (
                <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card/50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 py-20">
        <div className="container space-y-10">
          <div className="max-w-2xl space-y-4">
            <Badge variant="outline">Builder Quick Start</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">Connect n8n or your own AI app in minutes</h2>
            <p className="text-lg text-muted-foreground">
              StackMemory should be usable as infrastructure, not just as a workspace. The bridge gives you a direct path for memory writes, search, and query orchestration.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/integrations">
                <Button variant="outline">Open integration guide</Button>
              </Link>
              <Link href="/signup?workflow=custom_app">
                <Button>Start builder onboarding</Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="border-border/60 bg-card/60">
              <CardHeader>
                <CardTitle>Recommended flow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <span>Write project rules and preferences into StackMemory from n8n, MCP clients, or your app backend.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <span>Query memory before each coding or agent step so the current run starts with the right project context.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <span>Use MCP for supported coding tools, and use the bridge API for automation, internal copilots, and n8n pipelines.</span>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="mb-2 font-medium text-foreground">Best fit</div>
                  <div>Internal developer copilots, agent workflows, prompt routers, coding assistants, and automation pipelines that need durable project memory.</div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {builderQuickStarts.map((item) => (
                <Card key={item.title} className="border-border/60 bg-card/60">
                  <CardHeader>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription className="pt-2 text-sm text-muted-foreground">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="overflow-x-auto rounded-2xl border border-border/60 bg-background/80 p-4 text-sm leading-6 text-foreground">
                      <code>{item.code}</code>
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-background py-20">
        <div className="container space-y-10">
          <div className="max-w-2xl space-y-4">
            <Badge variant="outline">Live Demo Flows</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">Three concrete workflows to sell and demo</h2>
            <p className="text-lg text-muted-foreground">
              These are the clearest proof paths for StackMemory today: tool handoff, cloud IDE continuity, and embedded builder memory.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {demoScenarios.map((scenario) => (
              <Card key={scenario.title} className="border-border/60 bg-card/60">
                <CardHeader className="space-y-3">
                  <Badge variant="secondary" className="w-fit">{scenario.badge}</Badge>
                  <CardTitle className="text-2xl">{scenario.title}</CardTitle>
                  <CardDescription className="text-sm leading-6 text-muted-foreground">
                    {scenario.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  {scenario.steps.map((step, index) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                        {index + 1}
                      </div>
                      <span>{step}</span>
                    </div>
                  ))}
                  <div className="pt-3">
                    <Button asChild variant="outline" className="w-full">
                      <Link href={scenario.ctaHref}>{scenario.ctaLabel}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
            {quickStartWorkflows.map((item) => (
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

      <section className="border-t border-border/60 bg-muted/20 py-20">
        <div className="container">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-3xl border border-border/60 bg-card/60 px-6 py-12 text-center shadow-sm">
            <Badge variant="outline">Final CTA</Badge>
            <h2 className="max-w-3xl text-3xl font-bold sm:text-4xl">
              Give every AI coding tool the same project memory.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Start with one workflow, store the context that matters, and reuse it across sessions, tools, and agent runs.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/signup?workflow=cursor">
                <Button size="lg" className="rounded-xl px-8">
                  Start free
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="rounded-xl px-8">
                  Compare plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
