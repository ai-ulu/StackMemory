// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import MemoryGraph, { MemoryData, GraphNode } from '@/components/MemoryGraph';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Info } from 'lucide-react';

export default function MemoryGraphPage() {
  const [memories, setMemories] = useState<MemoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/memory/graph');
      
      if (!response.ok) {
        throw new Error('Bellek verileri yüklenemedi');
      }

      const data = await response.json();
      setMemories(data.memories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
      setMemories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Bellek Graf Görselleştirme</h1>
        <p className="text-muted-foreground">
          Hafıza sistemindeki belleklerin ilişkilerini keşfedin
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="text-muted-foreground">
            {error} - Demo veriler gösteriliyor
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graf */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bellek Ağı</CardTitle>
            <CardDescription>
              {memories.length} bellek • Zoom, pan ve drag ile etkileşim
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="w-full h-[600px]" />
            ) : (
              <MemoryGraph
                memories={memories}
                onNodeClick={handleNodeClick}
                width={800}
                height={600}
              />
            )}
          </CardContent>
        </Card>

        {/* Detaylar */}
        <Card>
          <CardHeader>
            <CardTitle>Bellek Detayları</CardTitle>
            <CardDescription>
              {selectedNode ? 'Seçili bellek bilgileri' : 'Bir düğüme tıklayın'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-1">ID</h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedNode.id}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">Tür</h3>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedNode.color }}
                    />
                    <span className="text-sm">{selectedNode.type}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">H(x,ψ) Puanı</h3>
                  <p className="text-sm">{selectedNode.score.toFixed(4)}</p>
                </div>
                {selectedNode.metadata.tags && (
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Etiketler</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.metadata.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-secondary text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedNode.metadata.timestamp && (
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Zaman</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedNode.metadata.timestamp).toLocaleString('tr-TR')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Graf üzerindeki bir düğüme tıklayarak detayları görüntüleyin
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Toplam Bellek</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kimlik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {memories.filter((m) => m.type === 'IDENTITY').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bilgi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {memories.filter((m) => m.type === 'FACT').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Puan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {memories.length > 0
                ? (
                    memories.reduce((sum, m) => sum + (m.metadata.score || 0), 0) /
                    memories.length
                  ).toFixed(3)
                : '0.000'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
