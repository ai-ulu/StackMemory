'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UsageSummary {
  totalRequests: number;
  totalInputTokens: number;
  totalFinalTokens: number;
  totalSavedTokens: number;
  estimatedSavedUsd: number;
  avgContextReduction: number;
  byAgent: Array<{ agentId: string; requests: number; savedTokens: number }>;
  byDay: Array<{ date: string; requests: number; savedTokens: number }>;
}

export default function SavingsDashboard() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(`/api/usage/summary?period=${period}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setSummary(data);
      } catch (error) {
        console.error('Error fetching summary:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [period]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!summary) {
    return <div className="p-8">Failed to load data</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Token Savings Dashboard</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value))}
          className="border rounded px-3 py-2"
        >
          <option value={7}>Son 7 gün</option>
          <option value={30}>Son 30 gün</option>
          <option value={90}>Son 90 gün</option>
        </select>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam İstek</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRequests.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasarruf Token</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(summary.totalSavedTokens / 1_000_000).toFixed(2)}M
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Tahmini Tasarruf ($)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summary.estimatedSavedUsd.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Ort. Context Azaltma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(summary.avgContextReduction * 100).toFixed(0)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Bazlı Kırılım */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Bazlı Tasarruflar</CardTitle>
          <CardDescription>En verimli agent'lar</carddescription>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Agent ID</th>
                <th className="text-right py-2">İstek Sayısı</th>
                <th className="text-right py-2">Tasarruf Token</th>
                <th className="text-right py-2">Tasarruf (%)</th>
              </tr>
            </thead>
            <tbody>
              {summary.byAgent
                .sort((a, b) => b.savedTokens - a.savedTokens)
                .slice(0, 10)
                .map((agent) => {
                  const savingsRate = agent.requests > 0 
                    ? ((agent.savedTokens / (agent.savedTokens + agent.requests * 1000)) * 100) 
                    : 0;
                  return (
                    <tr key={agent.agentId} className="border-b">
                      <td className="py-2 font-mono text-sm">{agent.agentId}</td>
                      <td className="text-right py-2">{agent.requests.toLocaleString()}</td>
                      <td className="text-right py-2 text-green-600">
                        {(agent.savedTokens / 1_000).toFixed(1)}K
                      </td>
                      <td className="text-right py-2">
                        {savingsRate.toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Günlük Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Günlük Tasarruf Trendi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end space-x-1">
            {summary.byDay.map((day) => {
              const maxSaved = Math.max(...summary.byDay.map(d => d.savedTokens));
              const height = maxSaved > 0 ? (day.savedTokens / maxSaved) * 100 : 0;
              return (
                <div
                  key={day.date}
                  className="flex-1 bg-green-500 rounded-t"
                  style={{ height: `${height}%` }}
                  title={`${day.date}: ${(day.savedTokens / 1_000).toFixed(1)}K token`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{summary.byDay[0]?.date}</span>
            <span>{summary.byDay[summary.byDay.length - 1]?.date}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
