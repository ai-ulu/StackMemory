"use client";

import React, { useMemo, useCallback, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface Memory {
  id: string;
  content: string;
  type: string;
  timestamp: string;
  importance: number;
  accessCount: number;
}

interface MemoryGraphProps {
  memories: Memory[];
  onNodeClick?: (memory: Memory) => void;
}

interface GraphNode {
  id: string;
  name: string;
  val: number;
  color: string;
  memory: Memory;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
}

const TYPE_COLORS: Record<string, string> = {
  conversation: '#3b82f6',
  workspace: '#10b981',
  preference: '#f59e0b',
  command: '#8b5cf6',
  profile: '#ec4899',
  knowledge: '#06b6d4',
  default: '#6b7280'
};

export default function MemoryGraph({ memories, onNodeClick }: MemoryGraphProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Calculate H(x,ψ) score (simplified)
  const calculateScore = useCallback((memory: Memory): number => {
    const daysSince = (Date.now() - new Date(memory.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    const decay = Math.exp(-daysSince / 30);
    const importance = memory.importance || 0.5;
    const frequency = Math.log(memory.accessCount + 1);
    
    // H(x,ψ) = β*decay + γ*importance + δ*frequency
    return 0.2 * decay + 0.3 * importance + 0.1 * frequency;
  }, []);

  // Calculate similarity (simple text overlap)
  const calculateSimilarity = useCallback((m1: Memory, m2: Memory): number => {
    const words1 = new Set(m1.content.toLowerCase().split(/\s+/));
    const words2 = new Set(m2.content.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }, []);

  const graphData = useMemo(() => {
    // Create nodes
    const nodes: GraphNode[] = memories.map(memory => ({
      id: memory.id,
      name: memory.content.substring(0, 50) + (memory.content.length > 50 ? '...' : ''),
      val: calculateScore(memory) * 100 + 10, // Node size
      color: TYPE_COLORS[memory.type] || TYPE_COLORS.default,
      memory
    }));

    // Create links based on similarity
    const links: GraphLink[] = [];
    for (let i = 0; i < memories.length; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        const similarity = calculateSimilarity(memories[i], memories[j]);
        
        // Only create link if similarity > 0.3
        if (similarity > 0.3) {
          links.push({
            source: memories[i].id,
            target: memories[j].id,
            value: similarity
          });
        }
      }
    }

    return { nodes, links };
  }, [memories, calculateScore, calculateSimilarity]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    if (onNodeClick) {
      onNodeClick(node.memory);
    }
  }, [onNodeClick]);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
  }, []);

  return (
    <div className="relative w-full h-full">
      <ForceGraph2D
        graphData={graphData}
        nodeLabel="name"
        nodeVal="val"
        nodeColor="color"
        linkWidth={(link: any) => link.value * 3}
        linkColor={() => 'rgba(100, 100, 100, 0.3)'}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          
          // Draw node circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.val / 10, 0, 2 * Math.PI);
          ctx.fillStyle = node.color;
          ctx.fill();
          
          // Draw border if selected or hovered
          if (selectedNode?.id === node.id || hoveredNode?.id === node.id) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
          }
          
          // Draw label
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, node.x, node.y + node.val / 10 + fontSize);
        }}
      />
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-black/80 p-4 rounded-lg text-white text-sm">
        <h3 className="font-bold mb-2">Memory Types</h3>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          type !== 'default' && (
            <div key={type} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{type}</span>
            </div>
          )
        ))}
      </div>
      
      {/* Selected node info */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 bg-black/80 p-4 rounded-lg text-white max-w-md">
          <h3 className="font-bold mb-2">Selected Memory</h3>
          <p className="text-sm mb-1">
            <span className="text-gray-400">Type:</span> {selectedNode.memory.type}
          </p>
          <p className="text-sm mb-1">
            <span className="text-gray-400">Content:</span> {selectedNode.memory.content}
          </p>
          <p className="text-sm mb-1">
            <span className="text-gray-400">Importance:</span> {selectedNode.memory.importance.toFixed(2)}
          </p>
          <p className="text-sm">
            <span className="text-gray-400">Access Count:</span> {selectedNode.memory.accessCount}
          </p>
        </div>
      )}
    </div>
  );
}
