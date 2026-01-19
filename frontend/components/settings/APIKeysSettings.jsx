'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

/**
 * API Keys Settings Panel
 * 
 * Features:
 * - List all API keys
 * - Create new keys with scope selection
 * - Revoke/delete keys
 * - View usage stats
 */

const SCOPE_INFO = {
  read: { name: 'Read Only', icon: '👁️', color: 'blue', description: 'Can search and query memories' },
  write: { name: 'Read & Write', icon: '✏️', color: 'green', description: 'Can create and update memories' },
  full: { name: 'Full Access', icon: '🔓', color: 'purple', description: 'Complete access including deletion' },
  admin: { name: 'Admin', icon: '👑', color: 'yellow', description: 'Full access plus key management' },
};

const CLIENT_TYPES = {
  cli: { name: 'CLI Tool', icon: '🖥️' },
  extension: { name: 'Browser Extension', icon: '🌐' },
  slack: { name: 'Slack Bot', icon: '💬' },
  discord: { name: 'Discord Bot', icon: '🎮' },
  telegram: { name: 'Telegram Bot', icon: '📱' },
  langchain: { name: 'LangChain/Agent', icon: '🦜' },
  chatgpt: { name: 'ChatGPT Action', icon: '🤖' },
  api: { name: 'Custom API', icon: '🔌' },
  other: { name: 'Other', icon: '📦' },
};

export default function APIKeysSettings() {
  const [keys, setKeys] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState(null);
  
  // Create form state
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScope, setNewKeyScope] = useState('full');
  const [newKeyClientType, setNewKeyClientType] = useState('api');
  const [newKeyExpires, setNewKeyExpires] = useState('never');

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    setLoading(true);
    try {
      const response = await fetch('/api/keys');
      const data = await response.json();
      
      if (data.error) {
        toast.error(data.error);
        return;
      }
      
      setKeys(data.keys || []);
      setStats(data.stats);
    } catch (error) {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }

  async function createKey() {
    setCreating(true);
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName || `${CLIENT_TYPES[newKeyClientType]?.name} Key`,
          scope: newKeyScope,
          clientType: newKeyClientType,
          expiresIn: newKeyExpires,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        toast.error(data.error);
        return;
      }
      
      // Show the new key (only time it's visible!)
      setNewKeyData(data);
      setShowCreateModal(false);
      
      // Reset form
      setNewKeyName('');
      setNewKeyScope('full');
      setNewKeyClientType('api');
      setNewKeyExpires('never');
      
      // Reload keys
      loadKeys();
      
      toast.success('API key created!');
    } catch (error) {
      toast.error('Failed to create key');
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(keyId, keyName) {
    if (!confirm(`Revoke "${keyName}"? This cannot be undone.`)) return;
    
    try {
      const response = await fetch(`/api/keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revoke: true }),
      });
      
      if (response.ok) {
        toast.success('Key revoked');
        loadKeys();
      } else {
        toast.error('Failed to revoke key');
      }
    } catch (error) {
      toast.error('Error revoking key');
    }
  }

  async function deleteKey(keyId, keyName) {
    if (!confirm(`Permanently delete "${keyName}"?`)) return;
    
    try {
      const response = await fetch(`/api/keys/${keyId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Key deleted');
        loadKeys();
      } else {
        toast.error('Failed to delete key');
      }
    } catch (error) {
      toast.error('Error deleting key');
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
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
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">API Keys</h3>
          <p className="text-sm text-gray-400">
            Manage keys for CLI, bots, and integrations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium"
        >
          + Create Key
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Keys" value={stats.total_keys || 0} icon="🔑" />
          <StatCard label="Active" value={stats.active_keys || 0} icon="✅" />
          <StatCard label="Total Requests" value={stats.total_requests || 0} icon="📊" />
          <StatCard label="Today" value={stats.requests_today || 0} icon="📈" />
        </div>
      )}

      {/* New Key Display (shown once after creation) */}
      {newKeyData && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-green-400">New API Key Created!</h4>
              <p className="text-sm text-gray-400 mt-1">
                Copy this key now. It will not be shown again.
              </p>
            </div>
            <button
              onClick={() => setNewKeyData(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="mt-4 bg-gray-900 rounded-lg p-3 flex items-center justify-between">
            <code className="text-green-400 font-mono text-sm break-all">
              {newKeyData.key}
            </code>
            <button
              onClick={() => copyToClipboard(newKeyData.key)}
              className="ml-2 px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-sm"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Keys List */}
      <div className="space-y-3">
        {keys.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No API keys yet.</p>
            <p className="text-sm mt-1">Create one to use AI-ULU from CLI, bots, or other apps.</p>
          </div>
        ) : (
          keys.map(key => (
            <KeyCard
              key={key.id}
              keyData={key}
              onRevoke={() => revokeKey(key.id, key.name)}
              onDelete={() => deleteKey(key.id, key.name)}
            />
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Create API Key</h3>
            
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="My CLI Key"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
              </div>
              
              {/* Client Type */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Client Type</label>
                <select
                  value={newKeyClientType}
                  onChange={(e) => setNewKeyClientType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                >
                  {Object.entries(CLIENT_TYPES).map(([value, { name, icon }]) => (
                    <option key={value} value={value}>
                      {icon} {name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Scope */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(SCOPE_INFO).map(([value, { name, icon, description }]) => (
                    <button
                      key={value}
                      onClick={() => setNewKeyScope(value)}
                      className={`p-3 rounded-lg border text-left ${
                        newKeyScope === value
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{icon}</span>
                        <span className="text-white font-medium">{name}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{description}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Expiration */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Expires</label>
                <select
                  value={newKeyExpires}
                  onChange={(e) => setNewKeyExpires(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                >
                  <option value="never">Never</option>
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                  <option value="90d">90 days</option>
                  <option value="1y">1 year</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={createKey}
                disabled={creating}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold text-white mt-1">{value}</div>
    </div>
  );
}

function KeyCard({ keyData, onRevoke, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const scopeInfo = SCOPE_INFO[keyData.scope] || SCOPE_INFO.read;
  const clientInfo = CLIENT_TYPES[keyData.clientType] || CLIENT_TYPES.other;
  
  return (
    <div className={`bg-gray-800/50 rounded-xl border ${keyData.isActive ? 'border-gray-700' : 'border-red-500/30'}`}>
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{clientInfo.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{keyData.name}</span>
              {!keyData.isActive && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">Revoked</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <code className="bg-gray-900 px-1 rounded">{keyData.keyPrefix}</code>
              <span className="flex items-center gap-1">
                {scopeInfo.icon} {scopeInfo.name}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <div className="text-gray-400">
              {keyData.usageCount} requests
            </div>
            <div className="text-gray-500">
              {keyData.lastUsedAt 
                ? `Last used ${new Date(keyData.lastUsedAt).toLocaleDateString()}`
                : 'Never used'}
            </div>
          </div>
          <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="text-gray-500">Created:</span>
              <span className="text-gray-300 ml-2">
                {new Date(keyData.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Expires:</span>
              <span className="text-gray-300 ml-2">
                {keyData.expiresAt 
                  ? new Date(keyData.expiresAt).toLocaleDateString()
                  : 'Never'}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {keyData.isActive && (
              <button
                onClick={(e) => { e.stopPropagation(); onRevoke(); }}
                className="px-3 py-1 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded text-sm"
              >
                Revoke
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
