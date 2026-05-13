import { Badge } from '@/components/ui/badge';
import { Database } from 'lucide-react';

export function IntegrationSurfacesSection({ surfaces }) {
  return (
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
          {surfaces.map((item) => (
            <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card/50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
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
  );
}
