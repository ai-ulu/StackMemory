import { ContextOptimizerClient } from '@/features/context/components/ContextOptimizerClient';
import { Badge } from '@/components/ui/badge';

export default function ContextDashboardPage() {
  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Badge variant="outline" className="mb-3">Token optimization</Badge>
          <h1 className="text-3xl font-bold tracking-tight">Context Optimizer</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Compile only the relevant memory context for an agent request, enforce token budgets, and measure estimated savings.
          </p>
        </div>
      </div>

      <ContextOptimizerClient />
    </>
  );
}
