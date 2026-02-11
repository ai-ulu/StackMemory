'use client';

import React, { useRef, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

// Dynamic import to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
});

// Bellek türlerine göre renkler
const MEMORY_TYPE_COLORS: Record<string, string> = {
  CONVERSATION: '#3b82f6', // blue
  KNOWLEDGE: '#10b981', // green
  COMMAND: '#f59e0b', // amber
  PREFERENCE: '#8b5cf6', // purple
  FEEDBACK: '#ec4899', // pink
  PATTERN: '#06b6d4', // cyan
  SOLUTION: '#14b8a6', // teal
};

export interface MemoryData {
  id: string;
  type: string;
  content: any;
  metadata: {
    timestamp: number;
    tags?: string[];
    score?: number;
    [key: string]: any;
  };
  connections?: string[];
}

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  score: number;
  color: string;
  size: number;
  metadata: any;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface MemoryGraphProps {
  memories: MemoryData[];
  onNodeClick?: (node: GraphNode) => void;
  width?: number;
  height?: number;
}

export default function MemoryGraph({
  memories,
  onNodeClick,
  width = 800,
  height = 600,
}: MemoryGraphProps) {
  const graphRef = useRef<any>();
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Bellek verilerini graf formatına dönüştür
  const graphData: GraphData = React.useMemo(() => {
    const nodes: GraphNode[] = memories.map((memory) => {
      const score = memory.metadata.score || 0.5;
      return {
        id: memory.id,
        name: memory.id.substring(0, 8),
        type: memory.type,
        score,
        color: MEMORY_TYPE_COLORS[memory.type] || '#6b7280',
        size: 5 + score * 10, // H(x,ψ) puanına göre boyutlandır
        metadata: memory.metadata,
      };
    });

    const links: GraphLink[] = [];
    memories.forEach((memory) => {
      if (memory.connections) {
        memory.connections.forEach((targetId) => {
          if (memories.find((m) => m.id === targetId)) {
            links.push({
              source: memory.id,
              target: targetId,
            });
          }
        });
      }
    });

    return { nodes, links };
  }, [memories]);

  // Node hover handler
  const handleNodeHover = useCallback((node: GraphNode | null, event?: MouseEvent) => {
    setHoveredNode(node);
    if (node && event) {
      setTooltipPos({ x: event.clientX, y: event.clientY });
    }
  }, []);

  // Node click handler
  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (onNodeClick) {
        onNodeClick(node);
      }
    },
    [onNodeClick]
  );

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * 1.2, 400);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() / 1.2, 400);
    }
  }, []);

  const handleZoomToFit = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50);
    }
  }, []);

  // Export graf data as JSON
  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(graphData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memory-graph-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [graphData]);

  return (
    <div className="relative w-full h-full">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomIn}
          title="Yakınlaştır"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomOut}
          title="Uzaklaştır"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomToFit}
          title="Tümünü Göster"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleExport}
          title="JSON Olarak İndir"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <h3 className="text-sm font-semibold mb-2">Bellek Türleri</h3>
        <div className="space-y-1">
          {Object.entries(MEMORY_TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span>{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredNode && (
        <div
          className="fixed z-50 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-xl max-w-xs"
          style={{
            left: tooltipPos.x + 10,
            top: tooltipPos.y + 10,
            pointerEvents: 'none',
          }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: hoveredNode.color }}
              />
              <span className="font-semibold text-sm">{hoveredNode.type}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              ID: {hoveredNode.id}
            </div>
            <div className="text-xs">
              H(x,ψ) Puanı: {hoveredNode.score.toFixed(3)}
            </div>
            {hoveredNode.metadata.tags && (
              <div className="text-xs">
                Etiketler: {hoveredNode.metadata.tags.join(', ')}
              </div>
            )}
            {hoveredNode.metadata.timestamp && (
              <div className="text-xs text-muted-foreground">
                {new Date(hoveredNode.metadata.timestamp).toLocaleString('tr-TR')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Graph */}
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={width}
        height={height}
        nodeLabel="name"
        nodeColor="color"
        nodeVal="size"
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = node.color;
          
          // Draw node circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw label
          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, node.x, node.y);
        }}
        onNodeHover={handleNodeHover as any}
        onNodeClick={handleNodeClick as any}
        linkColor={() => '#6b7280'}
        linkWidth={1}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        cooldownTicks={100}
        onEngineStop={() => {
          if (graphRef.current) {
            graphRef.current.zoomToFit(400, 50);
          }
        }}
      />
    </div>
  );
}
