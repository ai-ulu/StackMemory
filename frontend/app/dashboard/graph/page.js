import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MemoryGraphClient } from '@/features/graph/components/MemoryGraphClient';

export default function GraphPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container space-y-8 py-8">
        <div>
          <Button asChild variant="ghost" className="mb-4 px-0">
            <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard</Link>
          </Button>
          <Badge variant="outline" className="mb-3">Graph MVP</Badge>
          <h1 className="text-3xl font-bold tracking-tight">Memory Graph</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            İlk graph sürümü hafızaları node, ortak tip/tag ilişkilerini edge olarak çıkarır. Sonra bunu `memory_links` tablosuna bağlayacağız.
          </p>
        </div>

        <MemoryGraphClient />
      </div>
    </main>
  );
}
