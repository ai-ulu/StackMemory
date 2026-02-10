"use client";

import React, { useState, useEffect } from 'react';
import MemoryGraph from './MemoryGraph';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface Memory {
  id: string;
  content: string;
  type: string;
  timestamp: string;
  importance: number;
  accessCount: number;
}

interface MemoryStats {
  stm_size: number;
  stm_max: number;
  episodic_count: number;
  vector_count: number;
  timestamp: string;
}

export default function MemoryDashboard() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  // Load stats
  const loadStats = async () => {
    try {
      const response = await fetch('/api/memory/stats');
      const data = await response.json();
      if (data.status === 'success') {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Load recent episodes
  const loadEpisodes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/memory/episodes?limit=50');
      const data = await response.json();
      
      if (data.status === 'success') {
        // Convert episodes to memory format
        const memoryData: Memory[] = data.episodes.map((ep: any, idx: number) => ({
          id: `ep-${idx}`,
          content: ep.text,
          type: 'conversation',
          timestamp: ep.timestamp,
          importance: 0.5,
          accessCount: 1
        }));
        
        setMemories(memoryData);
      }
    } catch (error) {
      console.error('Error loading episodes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search memories
  const searchMemories = async () => {
    if (!query.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/memory/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, top_k: 20 })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Combine results from all layers
        const allResults: Memory[] = [];
        
        // Recent memories
        data.results.recent.forEach((item: any, idx: number) => {
          allResults.push({
            id: `recent-${idx}`,
            content: `${item.user} | ${item.system}`,
            type: 'conversation',
            timestamp: item.timestamp,
            importance: 0.8,
            accessCount: 1
          });
        });
        
        // Episodic memories
        data.results.episodic.forEach((ep: any, idx: number) => {
          allResults.push({
            id: `episodic-${idx}`,
            content: ep.text,
            type: 'conversation',
            timestamp: ep.timestamp,
            importance: 0.6,
            accessCount: 1
          });
        });
        
        setMemories(allResults);
      }
    } catch (error) {
      console.error('Error searching memories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadEpisodes();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Memory System</h1>
          <p className="text-muted-foreground">
            Visualize and explore your AI memory
          </p>
        </div>
        
        {stats && (
          <div className="flex gap-4">
            <Badge variant="outline">
              STM: {stats.stm_size}/{stats.stm_max}
            </Badge>
            <Badge variant="outline">
              Episodes: {stats.episodic_count}
            </Badge>
            <Badge variant="outline">
              Vectors: {stats.vector_count}
            </Badge>
          </div>
        )}
      </div>

      <Tabs defaultValue="graph" className="w-full">
        <TabsList>
          <TabsTrigger value="graph">Memory Graph</TabsTrigger>
          <TabsTrigger value="list">Memory List</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        <TabsContent value="graph" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Memory Network</CardTitle>
              <CardDescription>
                Interactive visualization of memory connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[600px] border rounded-lg overflow-hidden">
                {memories.length > 0 ? (
                  <MemoryGraph 
                    memories={memories}
                    onNodeClick={setSelectedMemory}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {loading ? 'Loading memories...' : 'No memories to display'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Memories</CardTitle>
              <CardDescription>
                Chronological list of stored memories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {memories.map((memory) => (
                  <div
                    key={memory.id}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => setSelectedMemory(memory)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary">{memory.type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(memory.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{memory.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Memories</CardTitle>
              <CardDescription>
                Find relevant memories using semantic search
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search memories..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchMemories()}
                />
                <Button onClick={searchMemories} disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
              
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {memories.map((memory) => (
                  <div
                    key={memory.id}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => setSelectedMemory(memory)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary">{memory.type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Importance: {memory.importance.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm">{memory.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selected memory detail */}
      {selectedMemory && (
        <Card>
          <CardHeader>
            <CardTitle>Memory Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Type:</span> {selectedMemory.type}
              </div>
              <div>
                <span className="font-semibold">Timestamp:</span>{' '}
                {new Date(selectedMemory.timestamp).toLocaleString()}
              </div>
              <div>
                <span className="font-semibold">Importance:</span>{' '}
                {selectedMemory.importance.toFixed(2)}
              </div>
              <div>
                <span className="font-semibold">Access Count:</span>{' '}
                {selectedMemory.accessCount}
              </div>
              <div>
                <span className="font-semibold">Content:</span>
                <p className="mt-2 p-4 bg-muted rounded-lg">{selectedMemory.content}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
