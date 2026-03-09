// @ts-nocheck
'use client'

import Link from 'next/link'
import { ArrowLeft, Braces, Check, ExternalLink, Network, Terminal, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const options = [
  {
    title: 'n8n via Bridge API',
    icon: Network,
    bestFor: 'Automation pipelines and no-code orchestration',
    steps: [
      'Create an HTTP Request node that writes memory to /v1/memory',
      'Search memory with /v1/search before running the next agent step',
      'Feed the returned context into your prompt or tool node',
    ],
    code: `POST http://localhost:8080/v1/memory
Authorization: Bearer ulu_full_xxx
Content-Type: application/json

{
  "content": "Use TypeScript-first changes and keep diffs small",
  "type": "preference",
  "source": "n8n"
}`,
  },
  {
    title: 'Custom App via Bridge Query',
    icon: Braces,
    bestFor: 'Internal copilots, agent backends, and custom developer apps',
    steps: [
      'Store durable project context once',
      'Call /v1/query before each agent run',
      'Write back new decisions or active tasks after each important step',
    ],
    code: `POST http://localhost:8080/v1/query
Authorization: Bearer ulu_full_xxx
Content-Type: application/json

{
  "query": "What should this coding agent remember before editing the repo?",
  "source": "custom_app",
  "context": {
    "workspace": "stackmemory-web"
  }
}`,
  },
  {
    title: 'MCP Client Integration',
    icon: Terminal,
    bestFor: 'Claude Desktop and MCP-compatible coding tools',
    steps: [
      'Run the MCP server package',
      'Point your MCP config at the StackMemory instance',
      'Use shared memory tools inside the client workflow',
    ],
    code: `{
  "mcpServers": {
    "stackmemory": {
      "command": "npx",
      "args": ["@ai-ulu/mcp-server"],
      "env": {
        "AI_ULU_API_URL": "https://your-stackmemory-instance.com",
        "AI_ULU_API_KEY": "ulu_full_xxx"
      }
    }
  }
}`,
  },
]

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="flex items-center gap-2 font-semibold">
            <Wrench className="h-5 w-5 text-primary" />
            StackMemory Integrations
          </div>
        </div>
      </div>

      <div className="container space-y-10 py-10">
        <div className="max-w-3xl space-y-4">
          <Badge variant="outline">Builder Setup</Badge>
          <h1 className="text-4xl font-bold tracking-tight">Integration guide for custom apps and automation</h1>
          <p className="text-lg text-muted-foreground">
            Pick the integration surface that matches your workflow. StackMemory can sit behind n8n pipelines, internal developer copilots, or MCP-compatible coding tools.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {options.map((option) => {
            const Icon = option.icon
            return (
              <Card key={option.title} className="border-border/60 bg-card/60">
                <CardHeader>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{option.title}</CardTitle>
                  <CardDescription>{option.bestFor}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {option.steps.map((step) => (
                      <div key={step} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                  <pre className="overflow-x-auto rounded-2xl border border-border/60 bg-background/80 p-4 text-sm leading-6 text-foreground">
                    <code>{option.code}</code>
                  </pre>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recommended rollout</CardTitle>
              <CardDescription>Use the same rollout pattern whether you start with n8n or a custom backend.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">1. Start with explicit writes</p>
                <p>Write project rules, coding preferences, and stable decisions first. Avoid trying to auto-capture everything on day one.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">2. Query before action</p>
                <p>Before an agent edits code or runs a workflow step, ask StackMemory what the agent should remember right now.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">3. Save only durable context</p>
                <p>Send back new decisions, task status changes, and reusable rules. Skip noisy logs and transient chatter.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Next actions</CardTitle>
              <CardDescription>Use the product path that matches where you are.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>If you want to try the workflow inside the app first, start a builder onboarding flow and create your starter memories.</p>
              <p>If you already know you need deployment control, API access, or custom support, use the builder sales path.</p>
            </CardContent>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="w-full sm:w-auto">
                <Link href="/signup?workflow=custom_app">Start builder onboarding</Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/pricing">
                  View builder pricing
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
