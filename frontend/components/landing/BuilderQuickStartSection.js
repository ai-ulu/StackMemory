import Link from 'next/link';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function BuilderQuickStartSection({ items }) {
  return (
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
              {[
                'Write project rules and preferences into StackMemory from n8n, MCP clients, or your app backend.',
                'Query memory before each coding or agent step so the current run starts with the right project context.',
                'Use MCP for supported coding tools, and use the bridge API for automation, internal copilots, and n8n pipelines.',
              ].map((text) => (
                <div key={text} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <span>{text}</span>
                </div>
              ))}
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="mb-2 font-medium text-foreground">Best fit</div>
                <div>Internal developer copilots, agent workflows, prompt routers, coding assistants, and automation pipelines that need durable project memory.</div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {items.map((item) => (
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
  );
}
