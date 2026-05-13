import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function FinalCtaSection() {
  return (
    <>
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
                <Button size="lg" className="rounded-xl px-8">Start free</Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="rounded-xl px-8">Compare plans</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
