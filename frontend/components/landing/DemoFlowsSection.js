import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DemoFlowsSection({ scenarios }) {
  return (
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
          {scenarios.map((scenario) => (
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
  );
}
