import Link from 'next/link';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function QuickStartsSection({ workflows }) {
  return (
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
          {workflows.map((item) => (
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
  );
}
