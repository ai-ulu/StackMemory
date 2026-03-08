'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Admin Dashboard
 * 
 * Platform management for administrators.
 * Features:
 * - User management
 * - System statistics
 * - MCP server status
 * - Revenue metrics
 */

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [mcpStatus, setMcpStatus] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  async function checkAdminAndLoadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if admin (simplified - should check role in DB)
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(user.email) && user.email !== 'admin@ai-ulu.com') {
      router.push('/chat');
      return;
    }

    setIsAdmin(true);
    await loadStats(supabase);
    await loadUsers(supabase);
    await loadMCPStatus();
    setLoading(false);
  }

  async function loadStats(supabase) {
    // Get user count
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get memory count
    const { count: memoryCount } = await supabase
      .from('memories')
      .select('*', { count: 'exact', head: true });

    // Get conversation count
    const { count: convCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    // Get today's new users (simplified)
    const today = new Date().toISOString().split('T')[0];
    const { count: todayUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    setStats({
      users: userCount || 0,
      memories: memoryCount || 0,
      conversations: convCount || 0,
      todayUsers: todayUsers || 0,
      revenue: {
        mrr: 0, // Would come from Stripe
        arr: 0,
        customers: 0,
      },
    });
  }

  async function loadUsers(supabase) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    setUsers(data || []);
  }

  async function loadMCPStatus() {
    try {
      const response = await fetch('/api/orchestrate');
      const data = await response.json();
      setMcpStatus(data);
    } catch (e) {
      setMcpStatus({ status: 'error' });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-3xl">🛡️</span>
              Admin Dashboard
            </h1>
            <p className="text-gray-400 text-sm">StackMemory Platform Yönetimi</p>
          </div>
          <button
            onClick={() => router.push('/chat')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
          >
            ← Chat'e Dön
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {['overview', 'users', 'mcp', 'revenue'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab === 'overview' && '📊 Genel Bakış'}
              {tab === 'users' && '👥 Kullanıcılar'}
              {tab === 'mcp' && '🔌 MCP Durumu'}
              {tab === 'revenue' && '💰 Gelir'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon="👥"
                title="Toplam Kullanıcı"
                value={stats?.users || 0}
                subtitle={`+${stats?.todayUsers || 0} bugün`}
                color="purple"
              />
              <StatCard
                icon="🧠"
                title="Toplam Hafıza"
                value={stats?.memories || 0}
                subtitle="Tüm kullanıcılar"
                color="cyan"
              />
              <StatCard
                icon="💬"
                title="Sohbetler"
                value={stats?.conversations || 0}
                subtitle="Konuşmalar"
                color="green"
              />
              <StatCard
                icon="🔌"
                title="MCP Durumu"
                value={mcpStatus?.enabledSources || 0}
                subtitle={`/ ${mcpStatus?.totalSources || 0} kaynak`}
                color="yellow"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Hızlı İşlemler</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ActionButton icon="🔄" label="Cache Temizle" onClick={() => alert('Cache temizlendi')} />
                <ActionButton icon="📊" label="Rapor İndir" onClick={() => alert('Rapor hazırlanıyor')} />
                <ActionButton icon="📧" label="Broadcast Email" onClick={() => alert('Email modal')} />
                <ActionButton icon="⚙️" label="Sistem Ayarları" onClick={() => alert('Ayarlar')} />
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Son Kullanıcılar</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Kullanıcı</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Kayıt</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Durum</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium">{user.full_name || 'İsimsiz'}</p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {new Date(user.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                          Aktif
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-purple-400 hover:text-purple-300 text-sm">
                          Görüntüle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MCP Tab */}
        {activeTab === 'mcp' && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">MCP Hub Durumu</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Durum</p>
                  <p className={`text-xl font-bold ${mcpStatus?.status === 'healthy' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {mcpStatus?.status === 'healthy' ? '✅ Çalışıyor' : '⚠️ Kontrol Et'}
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Versiyon</p>
                  <p className="text-xl font-bold text-white">{mcpStatus?.version || '1.0.0'}</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Aktif Kaynaklar</p>
                  <p className="text-xl font-bold text-purple-400">{mcpStatus?.enabledSources || 0}</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Toplam Kaynaklar</p>
                  <p className="text-xl font-bold text-white">{mcpStatus?.totalSources || 0}</p>
                </div>
              </div>

              <h4 className="text-md font-medium text-white mb-3">MCP Kaynakları</h4>
              <div className="space-y-2">
                {mcpStatus?.capabilities?.map((cap, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-900/30 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${cap.enabled ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                      <span className="text-white">{cap.name}</span>
                      <span className="text-gray-500 text-sm">({cap.source})</span>
                    </div>
                    <span className={`text-sm ${cap.enabled ? 'text-green-400' : 'text-gray-500'}`}>
                      {cap.enabled ? 'Aktif' : 'Devre Dışı'}
                    </span>
                  </div>
                )) || <p className="text-gray-500">Yükleniyor...</p>}
              </div>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard icon="💵" title="MRR" value="$0" subtitle="Monthly Recurring" color="green" />
              <StatCard icon="📈" title="ARR" value="$0" subtitle="Annual Recurring" color="purple" />
              <StatCard icon="👤" title="Paying Customers" value="0" subtitle="Aktif aboneler" color="cyan" />
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Stripe Entegrasyonu</h3>
              <p className="text-gray-400 mb-4">
                Stripe entegrasyonu için environment variable'ları ekleyin:
              </p>
              <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
{`STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx`}
              </pre>
              <button className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg">
                Stripe Dashboard'a Git →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, title, value, subtitle, color }) {
  const colorClasses = {
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-6 border`}>
      <span className="text-3xl">{icon}</span>
      <div className="mt-4">
        <h3 className="text-3xl font-bold text-white">{value}</h3>
        <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
      </div>
      <p className="text-xs text-gray-500 mt-2">{title}</p>
    </div>
  );
}

// Action Button Component
function ActionButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-gray-900/50 hover:bg-gray-700/50 rounded-lg transition-all"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm text-gray-300">{label}</span>
    </button>
  );
}
