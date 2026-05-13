import { Badge } from '@/components/ui/badge';
import { BrainDashboardClient } from '@/features/brain/components/BrainDashboardClient';

export default function BrainPage() {
  return (
    <>
      <div>
        <Badge variant="outline" className="mb-3">Brain MVP</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Brain Dashboard</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Hafıza sağlığı, riskler ve karar simülasyonu. Bu sürüm MCP kullanmaz; app service + Supabase memory akışını okur.
        </p>
      </div>

      <BrainDashboardClient />
    </>
  );
}
