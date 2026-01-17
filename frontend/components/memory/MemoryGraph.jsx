'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Brain,
  User,
  Sparkles,
  Database,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  Loader2,
} from 'lucide-react';

// Dynamic import for SSR compatibility
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  ),
});

// Type icons
const TypeIcon = ({ type, className }) => {
  switch (type) {
    case 'identity':
      return <User className={className} />;
    case 'preference':
      return <Sparkles className={className} />;
    case 'fact':
      return <Database className={className} />;
    default:
      return <Brain className={className} />;
  }
};

// Type labels in Turkish
const typeLabels = {
  identity: 'Kimlik',
  preference: 'Tercih',
  fact: 'Bilgi',
};

// Node tooltip content
function NodeTooltip({ node }) {
  if (!node) return null;
  
  return (
    <div className="p-3 max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        <TypeIcon type={node.type} className="w-4 h-4" />
        <Badge 
          variant="outline" 
          style={{ borderColor: node.color, color: node.color }}
        >
          {typeLabels[node.type] || node.type}
        </Badge>
      </div>
      
      <p className="text-sm mb-3">{node.content}</p>
      
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>H(x,ψ) Puanı:</span>
          <span className="font-mono">%{node.hScore?.total || 0}</span>
        </div>
        <div className="flex justify-between">
          <span>Solma (D):</span>
          <span className="font-mono">%{node.hScore?.decay || 0}</span>
        </div>
        <div className="flex justify-between">
          <span>Önem (I):</span>
          <span className="font-mono">%{node.hScore?.importance || 0}</span>
        </div>
        <div className="flex justify-between">
          <span>Frekans (F):</span>
          <span className="font-mono">%{node.hScore?.frequency || 0}</span>
        </div>
        <div className="flex justify-between">
          <span>Güvenilirlik:</span>
          <span className="font-mono">%{Math.round((node.confidence || 0) * 100)}</span>
        </div>
        <div className="flex justify-between">
          <span>Erişim:</span>
          <span className="font-mono">{node.accessCount || 0}x</span>
        </div>
      </div>
    </div>
  );
}

export default function MemoryGraph({ className = '' }) {
  const graphRef = useRef();
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [minSimilarity, setMinSimilarity] = useState(70);

  // Fetch graph data
  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/memories/graph?limit=50&minSimilarity=${minSimilarity / 100}`);
      
      if (!res.ok) {
        throw new Error('Graf verisi alınamadı');
      }
      
      const data = await res.json();
      
      // Transform for force-graph format
      const nodes = data.nodes || [];
      const links = (data.edges || []).map(edge => ({
        source: edge.source,
        target: edge.target,
        similarity: edge.similarity,
        width: edge.width,
      }));
      
      setGraphData({ nodes, links });
      setStats(data.stats);
    } catch (err) {
      console.error('Graph fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [minSimilarity]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Zoom controls
  const handleZoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * 1.5, 300);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() / 1.5, 300);
    }
  };

  const handleReset = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50);
    }
  };

  // Node click handler
  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
  }, []);

  // Custom node rendering
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const label = node.contentPreview?.slice(0, 20) + '...' || '';
    const fontSize = Math.max(10 / globalScale, 3);
    const size = node.size || 8;
    
    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = node.color || '#6B7280';
    ctx.fill();
    
    // Draw border for selected/hovered
    if (selectedNode?.id === node.id || hoveredNode?.id === node.id) {
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Draw label only when zoomed in
    if (globalScale > 0.8) {
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(label, node.x, node.y + size + 2);
    }
  }, [selectedNode, hoveredNode]);

  // Link rendering
  const linkCanvasObject = useCallback((link, ctx) => {
    const start = link.source;
    const end = link.target;
    
    if (typeof start !== 'object' || typeof end !== 'object') return;
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = `rgba(100, 100, 100, ${(link.similarity || 70) / 100 * 0.5})`;
    ctx.lineWidth = link.width || 1;
    ctx.stroke();
  }, []);

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-[500px]">
          <div className="text-center text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Graf yüklenemedi: {error}</p>
            <Button onClick={fetchGraphData} className="mt-4">
              Tekrar Dene
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Hafıza Grafiği
              </CardTitle>
              <CardDescription>
                Hafızalar arası ilişkileri ve H(x,ψ) puanlarını görselleştirin
              </CardDescription>
            </div>
            
            {/* Stats badges */}
            {stats && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-violet-500 border-violet-500/30">
                  <User className="w-3 h-3 mr-1" />
                  {stats.byType?.identity || 0}
                </Badge>
                <Badge variant="outline" className="text-teal-500 border-teal-500/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {stats.byType?.preference || 0}
                </Badge>
                <Badge variant="outline" className="text-gray-500 border-gray-500/30">
                  <Database className="w-3 h-3 mr-1" />
                  {stats.byType?.fact || 0}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleZoomIn}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Yakınlaştır</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleZoomOut}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Uzaklaştır</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sıfırla</TooltipContent>
              </Tooltip>
            </div>
            
            {/* Similarity threshold slider */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Min. Benzerlik: %{minSimilarity}
              </span>
              <Slider
                value={[minSimilarity]}
                onValueChange={([val]) => setMinSimilarity(val)}
                onValueCommit={fetchGraphData}
                min={50}
                max={95}
                step={5}
                className="w-32"
              />
            </div>
          </div>
          
          {/* Graph container */}
          <div className="relative rounded-lg border bg-zinc-950 overflow-hidden" style={{ height: 500 }}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : graphData.nodes.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Henüz hafıza yok</p>
                  <p className="text-sm">AI ile sohbet ederek hafızanızı oluşturun</p>
                </div>
              </div>
            ) : (
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                nodeCanvasObject={nodeCanvasObject}
                linkCanvasObject={linkCanvasObject}
                nodeRelSize={6}
                linkWidth={link => link.width || 1}
                linkDirectionalParticles={0}
                backgroundColor="transparent"
                onNodeClick={handleNodeClick}
                onNodeHover={setHoveredNode}
                cooldownTicks={100}
                onEngineStop={() => graphRef.current?.zoomToFit(400, 50)}
              />
            )}
            
            {/* Hovered node tooltip */}
            {hoveredNode && (
              <div 
                className="absolute bg-popover border rounded-lg shadow-lg z-10 pointer-events-none"
                style={{ 
                  left: '50%', 
                  bottom: 20,
                  transform: 'translateX(-50%)',
                }}
              >
                <NodeTooltip node={hoveredNode} />
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-violet-500" />
              <span>Kimlik</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-500" />
              <span>Tercih</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <span>Bilgi</span>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Node büyüklüğü H(x,ψ) puanına göre belirlenir</p>
                  <p>Çizgiler %{minSimilarity}+ benzerlik gösterir</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          
          {/* Stats summary */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Toplam Hafıza</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{stats.connections}</p>
                <p className="text-xs text-muted-foreground">Bağlantı</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">%{stats.avgConfidence}</p>
                <p className="text-xs text-muted-foreground">Ort. Güvenilirlik</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">%{stats.avgHScore}</p>
                <p className="text-xs text-muted-foreground">Ort. H(x,ψ)</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
