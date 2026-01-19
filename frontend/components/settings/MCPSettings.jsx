'use client';

import { useState, useEffect } from 'react';

/**
 * MCP Settings Panel
 * Manage MCP server configurations
 */

const BUILTIN_SERVERS = [
  {
    id: 'ai-ulu-memory',
    name: 'AI-ULU Hafiza',
    icon: '🧠',
    description: 'Kisisel hafiza sistemi',
    alwaysEnabled: true,
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    icon: '🔍',
    description: 'Web aramasi',
    envKey: 'BRAVE_API_KEY',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: '💻',
    description: 'Kod ve repo aramasi',
    envKey: 'GITHUB_TOKEN',
  },
  {
    id: 'filesystem',
    name: 'Filesystem',
    icon: '📁',
    description: 'Yerel dosya erisimi',
    localOnly: true,
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: '📝',
    description: 'Notion sayfalari',
    envKey: 'NOTION_API_KEY',
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    description: 'Slack mesajlari',
    envKey: 'SLACK_BOT_TOKEN',
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    icon: '🗄️',
    description: 'Veritabani sorgulari',
    envKey: 'DATABASE_URL',
  },
];

export default function MCPSettings() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hubStatus, setHubStatus] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    
    try {
      const response = await fetch('/api/orchestrate');
      const data = await response.json();
      setHubStatus(data);
    } catch (e) {
      setHubStatus({ status: 'error' });
    }

    const saved = localStorage.getItem('ai-ulu-mcp-settings');
    const savedSettings = saved ? JSON.parse(saved) : {};

    const mergedServers = BUILTIN_SERVERS.map(server => ({
      ...server,
      enabled: savedSettings[server.id]?.enabled ?? (server.alwaysEnabled || false),
    }));

    setServers(mergedServers);
    setLoading(false);
  }

  function toggleServer(serverId) {
    const server = servers.find(s => s.id === serverId);
    if (server?.alwaysEnabled) return;

    const updated = servers.map(s => 
      s.id === serverId ? { ...s, enabled: !s.enabled } : s
    );
    setServers(updated);
    
    const settings = {};
    updated.forEach(s => {
      settings[s.id] = { enabled: s.enabled };
    });
    localStorage.setItem('ai-ulu-mcp-settings', JSON.stringify(settings));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hub Status */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔌</span>
            <div>
              <h3 className="font-semibold text-white">MCP Hub Durumu</h3>
              <p className="text-sm text-gray-400">
                {hubStatus?.enabledSources || 0} / {hubStatus?.totalSources || 0} kaynak aktif
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            hubStatus?.status === 'healthy' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {hubStatus?.status === 'healthy' ? 'Calisiyor' : 'Hata'}
          </span>
        </div>
      </div>

      {/* Servers List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">MCP Sunuculari</h3>
        
        {servers.map(server => (
          <div 
            key={server.id}
            className="bg-gray-800/30 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{server.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white">{server.name}</h4>
                    {server.alwaysEnabled && (
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">Zorunlu</span>
                    )}
                    {server.localOnly && (
                      <span className="px-2 py-0.5 bg-gray-500/20 text-gray-300 rounded text-xs">Yerel</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{server.description}</p>
                  {server.envKey && (
                    <p className="text-xs text-gray-500 mt-1">ENV: {server.envKey}</p>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => toggleServer(server.id)}
                disabled={server.alwaysEnabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  server.enabled ? 'bg-purple-600' : 'bg-gray-600'
                } ${server.alwaysEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    server.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
        <h4 className="font-medium text-purple-300 mb-2">MCP Hub Nasil Calisir?</h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>Sorgunuz analiz edilir ve ilgili MCP sunucularina yonlendirilir</li>
          <li>Hafiza her zaman ilk kontrol edilir</li>
          <li>Eksik bilgi varsa dis kaynaklardan cekilir</li>
          <li>Sonuclar birlestirilip size sunulur</li>
        </ul>
      </div>
    </div>
  );
}
