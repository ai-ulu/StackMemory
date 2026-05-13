import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeveloperMemoryPackCard } from '@/components/landing/DeveloperMemoryPackCard';
import { IconList } from '@/components/landing/IconList';
import { WorkflowTargetGrid } from '@/components/landing/WorkflowTargetGrid';

export function HeroSection({
  heroBenefits,
  proofPoints,
  workflowTargets,
  developerMemoryPack,
}) {
  return (
    <section className="border-b border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.12),transparent_30%)]">
      <div className="container py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-8">
            <Badge variant="outline" className="rounded-full px-4 py-1">
              For Claude Code, Cursor, Codex-style agents, VS Code workflows, Bolt, Lovable, Replit, and custom AI apps
            </Badge>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Stop re-explaining your project to every{' '}
                <span className="bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent">
                  AI coding tool
                </span>
                .
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                StackMemory gives Claude Code, Cursor, Codex-style agents, Replit, Bolt, Lovable, and your own AI apps one shared memory layer for project context, coding preferences, architecture decisions, and active tasks.
              </p>
              <div className="rounded-2xl border border-border/60 bg-card/50 p-4 text-sm text-muted-foreground">
                Use it in two ways: as your personal memory workspace across multiple AI coding tools, or as the memory backend inside the AI products and automations you build.
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

            <IconList items={heroBenefits} className="grid gap-3 pt-2 sm:grid-cols-2" />

            <div className="grid gap-3 rounded-3xl border border-border/60 bg-card/40 p-5">
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Why this wins over built-in tool memory
              </div>
              <IconList items={proofPoints} className="grid gap-3" />
            </div>

            <WorkflowTargetGrid targets={workflowTargets} />
          </div>

          <DeveloperMemoryPackCard items={developerMemoryPack} />
        </div>
      </div>
    </section>
  );
}
