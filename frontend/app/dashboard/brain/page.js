import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BrainDashboardClient } from '@/features/brain/components/BrainDashboardClient';

export default function BrainPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container space-y-8 py-8">
        <div>
          <Button asChild variant="ghost" className="mb-4 px-0">
            <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard</Link>
          </Button>
          <Badge variant="outline" className="mb-3">Brain MVP</Badge>
          <h1 className="text-3xl font-bold tracking-tight">Brain Dashboard</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Hafıza sağlığı, riskler ve karar simülasyonu. Bu sürüm MCP kullanmaz; app service + Supabase memory akışını okur.
          </p>
        </div>

        <BrainDashboardClient />
      </div>
    </main>
  );
}
