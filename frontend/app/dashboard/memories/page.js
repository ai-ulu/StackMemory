import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MemoryExplorerClient } from '@/features/memory/components/MemoryExplorerClient';

export default function MemoriesPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container space-y-8 py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Button asChild variant="ghost" className="mb-4 px-0">
              <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard</Link>
            </Button>
            <Badge variant="outline" className="mb-3">Memory CRUD UI</Badge>
            <h1 className="text-3xl font-bold tracking-tight">Memory Explorer</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Artık bu ekran `/api/memories` üzerinden listeler, oluşturur, düzenler ve deprecate eder. MCP hâlâ parkta; akış app service + Supabase adapter üzerinden ilerler.
            </p>
          </div>
        </div>

        <MemoryExplorerClient />
      </div>
    </main>
  );
}
