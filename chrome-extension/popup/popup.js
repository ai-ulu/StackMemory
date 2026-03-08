/**
 * StackMemory Chrome Extension - Popup Script
 */

// Configuration
const CONFIG = {
  apiUrl: 'https://ai-ulu.com', // Production URL
  devApiUrl: 'http://localhost:3000', // Development URL
};

// State
let isAuthenticated = false;
let apiKey = null;
let currentTab = null;

// DOM Elements
const elements = {
  connectionStatus: document.getElementById('connectionStatus'),
  authSection: document.getElementById('authSection'),
  mainSection: document.getElementById('mainSection'),
  loginBtn: document.getElementById('loginBtn'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
  captureInput: document.getElementById('captureInput'),
  memoryType: document.getElementById('memoryType'),
  captureBtn: document.getElementById('captureBtn'),
  capturePageBtn: document.getElementById('capturePageBtn'),
  captureSelectionBtn: document.getElementById('captureSelectionBtn'),
  recentMemories: document.getElementById('recentMemories'),
  totalMemories: document.getElementById('totalMemories'),
  todayMemories: document.getElementById('todayMemories'),
  extensionMemories: document.getElementById('extensionMemories'),
  settingsLink: document.getElementById('settingsLink'),
  dashboardLink: document.getElementById('dashboardLink'),
  logoutLink: document.getElementById('logoutLink'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage'),
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  // Load stored credentials
  const stored = await chrome.storage.local.get(['apiKey', 'apiUrl']);
  if (stored.apiKey) {
    apiKey = stored.apiKey;
    CONFIG.apiUrl = stored.apiUrl || CONFIG.apiUrl;
    await checkAuth();
  } else {
    showAuthSection();
  }

  // Setup event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Auth
  elements.loginBtn.addEventListener('click', handleLogin);
  elements.saveApiKeyBtn.addEventListener('click', handleSaveApiKey);

  // Capture
  elements.captureBtn.addEventListener('click', handleCapture);
  elements.capturePageBtn.addEventListener('click', handleCapturePage);
  elements.captureSelectionBtn.addEventListener('click', handleCaptureSelection);

  // Footer
  elements.settingsLink.addEventListener('click', openSettings);
  elements.dashboardLink.addEventListener('click', openDashboard);
  elements.logoutLink.addEventListener('click', handleLogout);
}

// Auth Functions
async function checkAuth() {
  try {
    setConnectionStatus('connecting');
    
    const response = await fetch(`${CONFIG.apiUrl}/api/extension/capture`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      isAuthenticated = true;
      setConnectionStatus('connected');
      showMainSection();
      loadRecentMemories();
      loadStats();
    } else {
      throw new Error('Auth failed');
    }
  } catch (error) {
    setConnectionStatus('error');
    showAuthSection();
  }
}

function handleLogin() {
  // Open StackMemory login page in new tab
  chrome.tabs.create({ url: `${CONFIG.apiUrl}/login?extension=true` });
}

async function handleSaveApiKey() {
  const key = elements.apiKeyInput.value.trim();
  if (!key) {
    showToast('API anahtarı gerekli', 'error');
    return;
  }

  apiKey = key;
  await chrome.storage.local.set({ apiKey: key, apiUrl: CONFIG.apiUrl });
  await checkAuth();
}

async function handleLogout() {
  await chrome.storage.local.remove(['apiKey']);
  apiKey = null;
  isAuthenticated = false;
  showAuthSection();
  setConnectionStatus('error');
}

// UI Functions
function showAuthSection() {
  elements.authSection.classList.remove('hidden');
  elements.mainSection.classList.add('hidden');
  elements.logoutLink.classList.add('hidden');
}

function showMainSection() {
  elements.authSection.classList.add('hidden');
  elements.mainSection.classList.remove('hidden');
  elements.logoutLink.classList.remove('hidden');
}

function setConnectionStatus(status) {
  const dot = elements.connectionStatus.querySelector('.status-dot');
  const text = elements.connectionStatus.querySelector('.status-text');

  dot.className = 'status-dot';
  
  switch (status) {
    case 'connected':
      dot.classList.add('connected');
      text.textContent = 'Bağlı';
      break;
    case 'connecting':
      text.textContent = 'Bağlanıyor...';
      break;
    case 'error':
      dot.classList.add('error');
      text.textContent = 'Bağlantı yok';
      break;
  }
}

function showToast(message, type = 'success') {
  elements.toast.classList.remove('hidden', 'success', 'error');
  elements.toast.classList.add(type);
  elements.toastMessage.textContent = message;
  
  setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 3000);
}

// Capture Functions
async function handleCapture() {
  const content = elements.captureInput.value.trim();
  if (!content) {
    showToast('İçerik gerekli', 'error');
    return;
  }

  const type = elements.memoryType.value;
  await captureMemory(content, type, currentTab?.url, currentTab?.title);
  elements.captureInput.value = '';
}

async function handleCapturePage() {
  if (!currentTab) return;

  // Get page content via content script
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: () => {
        // Get main content
        const article = document.querySelector('article') || document.querySelector('main') || document.body;
        const text = article.innerText.slice(0, 5000); // Limit to 5000 chars
        return text;
      },
    });

    if (result?.result) {
      await captureMemory(result.result, 'fact', currentTab.url, currentTab.title);
    }
  } catch (error) {
    showToast('Sayfa içeriği alınamadı', 'error');
  }
}

async function handleCaptureSelection() {
  if (!currentTab) return;

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: () => window.getSelection()?.toString(),
    });

    if (result?.result) {
      await captureMemory(result.result, 'fact', currentTab.url, currentTab.title);
    } else {
      showToast('Önce bir metin seçin', 'error');
    }
  } catch (error) {
    showToast('Seçili metin alınamadı', 'error');
  }
}

async function captureMemory(content, type, url, title) {
  try {
    const response = await fetch(`${CONFIG.apiUrl}/api/extension/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        content,
        url,
        title,
        selectedText: content,
        autoProcess: true,
      }),
    });

    if (!response.ok) {
      throw new Error('Capture failed');
    }

    const data = await response.json();
    
    if (data.success) {
      showToast('Hafızaya kaydedildi! ✨', 'success');
      loadRecentMemories();
      loadStats();
    } else {
      showToast(data.message || 'Kayıt başarısız', 'error');
    }
  } catch (error) {
    showToast('Kayıt hatası: ' + error.message, 'error');
  }
}

// Data Functions
async function loadRecentMemories() {
  try {
    const response = await fetch(`${CONFIG.apiUrl}/api/memories?limit=5&source=extension`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) throw new Error('Failed to load');

    const data = await response.json();
    const memories = data.memories || data || [];

    if (memories.length === 0) {
      elements.recentMemories.innerHTML = '<div class="loading">Henüz kayıt yok</div>';
      return;
    }

    elements.recentMemories.innerHTML = memories.map(mem => `
      <div class="recent-item">
        <span class="recent-item-type">${getTypeIcon(mem.type)}</span>
        <span class="recent-item-content">${escapeHtml(mem.content)}</span>
        <span class="recent-item-time">${formatTime(mem.created_at)}</span>
      </div>
    `).join('');
  } catch (error) {
    elements.recentMemories.innerHTML = '<div class="loading">Yüklenemedi</div>';
  }
}

async function loadStats() {
  try {
    const response = await fetch(`${CONFIG.apiUrl}/api/extension/capture`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) return;

    const data = await response.json();
    
    elements.totalMemories.textContent = data.stats?.total || '-';
    elements.todayMemories.textContent = data.stats?.today || '-';
    elements.extensionMemories.textContent = data.stats?.total || '-';
  } catch (error) {
    // Ignore stats errors
  }
}

// Helper Functions
function getTypeIcon(type) {
  switch (type) {
    case 'identity': return '👤';
    case 'preference': return '💜';
    case 'fact': return '📚';
    default: return '📝';
  }
}

function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Şimdi';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}dk`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}sa`;
  return `${Math.floor(diff / 86400000)}g`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function openSettings() {
  chrome.tabs.create({ url: `${CONFIG.apiUrl}/settings` });
}

function openDashboard() {
  chrome.tabs.create({ url: `${CONFIG.apiUrl}/chat` });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_SUCCESS') {
    apiKey = message.apiKey;
    chrome.storage.local.set({ apiKey: message.apiKey });
    checkAuth();
  }
});

// ==============================================
// MCP HUB INTEGRATION - Query across all sources
// ==============================================

/**
 * Query MCP Hub for intelligent multi-source answers
 * This allows the extension to leverage:
 * - Local StackMemory memory
 * - Web search (Brave)
 * - GitHub code search
 * - And other connected MCPs
 */
async function queryMCPHub(query) {
  try {
    const response = await fetch(`${CONFIG.apiUrl}/api/orchestrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ 
        query,
        options: { timeout: 8000 }
      }),
    });

    if (!response.ok) {
      throw new Error('Hub query failed');
    }

    return await response.json();
  } catch (error) {
    console.error('MCP Hub query error:', error);
    return null;
  }
}

/**
 * Smart capture - uses MCP Hub to enrich content before saving
 */
async function smartCapture(content, type, url, title) {
  // First, check if similar memory exists via hub
  const hubResult = await queryMCPHub(`Do I have any memories about: ${content.slice(0, 200)}`);
  
  if (hubResult?.synthesized?.sources?.some(s => s.serverId === 'ai-ulu-memory')) {
    // Similar memory exists - ask user if they want to update
    const existingContent = hubResult.synthesized.answer;
    if (existingContent.length > 50) {
      showToast('Benzer hafiza mevcut', 'info');
    }
  }

  // Proceed with normal capture
  await captureMemory(content, type, url, title);
}

/**
 * Add context menu query option
 */
function setupContextMenuQuery() {
  // This would be in background.js for actual implementation
  // Here we just add the UI handler
}

// Export for potential use in other extension scripts
if (typeof window !== 'undefined') {
  window.aiUluHub = {
    query: queryMCPHub,
    smartCapture,
  };
}
