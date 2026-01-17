'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuthAndLoadStats();
  }, [timeRange]);

  async function checkAuthAndLoadStats() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    setUser(user);
    await loadStats(supabase, user.id);
  }

  async function loadStats(supabase, userId) {
    setLoading(true);
    
    try {
      // Get time range
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch memories
      const { data: memories } = await supabase
        .from('memories')
        .select('id, type, created_at, confidence, access_count, write_source')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      // Fetch all memories for total count
      const { count: totalCount } = await supabase
        .from('memories')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'active');

      // Calculate stats
      const memoriesList = memories || [];
      
      // By type
      const byType = {
        identity: memoriesList.filter(m => m.type === 'identity').length,
        preference: memoriesList.filter(m => m.type === 'preference').length,
        fact: memoriesList.filter(m => m.type === 'fact').length,
      };

      // By source
      const bySource = {};
      memoriesList.forEach(m => {
        const source = m.write_source || 'chat';
        bySource[source] = (bySource[source] || 0) + 1;
      });

      // Daily distribution
      const dailyData = {};
      memoriesList.forEach(m => {
        const day = new Date(m.created_at).toLocaleDateString('tr-TR');
        dailyData[day] = (dailyData[day] || 0) + 1;
      });

      // Average confidence
      const avgConfidence = memoriesList.length > 0
        ? memoriesList.reduce((sum, m) => sum + (m.confidence || 0.8), 0) / memoriesList.length
        : 0;

      // Most accessed
      const sortedByAccess = [...memoriesList].sort((a, b) => (b.access_count || 0) - (a.access_count || 0));
      const topAccessed = sortedByAccess.slice(0, 5);

      // Today's count
      const today = new Date().toDateString();
      const todayCount = memoriesList.filter(m => new Date(m.created_at).toDateString() === today).length;

      // Growth rate
      const halfPoint = Math.floor(memoriesList.length / 2);
      const firstHalf = memoriesList.slice(halfPoint);
      const secondHalf = memoriesList.slice(0, halfPoint);
      const growthRate = firstHalf.length > 0 
        ? ((secondHalf.length - firstHalf.length) / firstHalf.length * 100).toFixed(1)
        : 0;

      setStats({
        total: totalCount || 0,
        period: memoriesList.length,
        today: todayCount,
        byType,
        bySource,
        dailyData,
        avgConfidence: (avgConfidence * 100).toFixed(0),
        topAccessed,
        growthRate,
      });
    } catch (error) {
      console.error('Stats loading error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Analytics yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-4xl">📊</span>
              Hafıza Analytics
            </h1>
            <p className="text-gray-400 mt-1">Hafıza kullanım istatistikleriniz</p>
          </div>
          
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {range === '7d' ? '7 Gün' : range === '30d' ? '30 Gün' : '90 Gün'}
              </button>
            ))}
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon="🧠"
            title="Toplam Hafıza"
            value={stats.total}
            subtitle="Tüm zamanlar"
            color="purple"
          />
          <StatCard
            icon="📈"
            title="Bu Dönem"
            value={stats.period}
            subtitle={`Son ${timeRange === '7d' ? '7 gün' : timeRange === '30d' ? '30 gün' : '90 gün'}`}
            color="cyan"
            trend={stats.growthRate > 0 ? `+${stats.growthRate}%` : `${stats.growthRate}%`}
          />
          <StatCard
            icon="📅"
            title="Bugün"
            value={stats.today}
            subtitle="Yeni hafızalar"
            color="green"
          />
          <StatCard
            icon="🎯"
            title="Ortalama Güven"
            value={`%${stats.avgConfidence}`}
            subtitle="Confidence score"
            color="yellow"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Type Distribution */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Hafıza Türleri</h3>
            <div className="space-y-4">
              <TypeBar 
                label="👤 Kimlik" 
                value={stats.byType.identity} 
                total={stats.period} 
                color="violet" 
              />
              <TypeBar 
                label="💜 Tercih" 
                value={stats.byType.preference} 
                total={stats.period} 
                color="pink" 
              />
              <TypeBar 
                label="📚 Bilgi" 
                value={stats.byType.fact} 
                total={stats.period} 
                color="cyan" 
              />
            </div>
          </div>

          {/* Source Distribution */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Kaynak Dağılımı</h3>
            <div className="space-y-4">
              {Object.entries(stats.bySource).map(([source, count]) => (
                <TypeBar 
                  key={source}
                  label={getSourceLabel(source)} 
                  value={count} 
                  total={stats.period} 
                  color={getSourceColor(source)} 
                />
              ))}
              {Object.keys(stats.bySource).length === 0 && (
                <p className="text-gray-500 text-center py-4">Veri yok</p>
              )}
            </div>
          </div>
        </div>

        {/* Daily Chart */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Günlük Aktivite</h3>
          <div className="h-48 flex items-end gap-1">
            {Object.entries(stats.dailyData).slice(-14).map(([day, count], i) => {
              const maxCount = Math.max(...Object.values(stats.dailyData));
              const height = maxCount > 0 ? (count / maxCount * 100) : 0;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t transition-all hover:from-purple-500 hover:to-purple-300"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${day}: ${count} hafıza`}
                  />
                  <span className="text-xs text-gray-500 rotate-45 origin-left">
                    {day.split('.').slice(0, 2).join('.')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Accessed */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">En Çok Erişilen Hafızalar</h3>
          <div className="space-y-3">
            {stats.topAccessed.map((memory, i) => (
              <div 
                key={memory.id}
                className="flex items-center gap-4 p-3 bg-gray-900/50 rounded-lg"
              >
                <span className="text-2xl font-bold text-gray-600">#{i + 1}</span>
                <div className="flex-1">
                  <span className="text-sm text-gray-300">
                    {getTypeIcon(memory.type)} {memory.type}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold text-purple-400">
                    {memory.access_count || 0}
                  </span>
                  <span className="text-xs text-gray-500 block">erişim</span>
                </div>
              </div>
            ))}
            {stats.topAccessed.length === 0 && (
              <p className="text-gray-500 text-center py-4">Henüz veri yok</p>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/chat')}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all"
          >
            ← Sohbete Dön
          </button>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, title, value, subtitle, color, trend }) {
  const colorClasses = {
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-6 border`}>
      <div className="flex justify-between items-start">
        <span className="text-3xl">{icon}</span>
        {trend && (
          <span className={`text-sm font-medium ${parseFloat(trend) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-bold text-white">{value}</h3>
        <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
      </div>
      <p className="text-xs text-gray-500 mt-2">{title}</p>
    </div>
  );
}

// Type Bar Component
function TypeBar({ label, value, total, color }) {
  const percentage = total > 0 ? (value / total * 100).toFixed(0) : 0;
  
  const colorClasses = {
    violet: 'bg-violet-500',
    pink: 'bg-pink-500',
    cyan: 'bg-cyan-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-gray-500',
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">{value} (%{percentage})</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color]} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Helper functions
function getTypeIcon(type) {
  switch (type) {
    case 'identity': return '👤';
    case 'preference': return '💜';
    case 'fact': return '📚';
    default: return '📝';
  }
}

function getSourceLabel(source) {
  const labels = {
    chat: '💬 Sohbet',
    extension: '🌐 Extension',
    mcp: '🔌 MCP',
    api: '⚡ API',
    import: '📥 Import',
  };
  return labels[source] || `📦 ${source}`;
}

function getSourceColor(source) {
  const colors = {
    chat: 'violet',
    extension: 'cyan',
    mcp: 'green',
    api: 'yellow',
    import: 'pink',
  };
  return colors[source] || 'gray';
}
