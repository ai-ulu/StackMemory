/**
 * StackMemory Chrome Extension - Background Service Worker
 */

const CONFIG = {
  apiUrl: 'https://ai-ulu.com',
  devApiUrl: 'http://localhost:3000',
};

// Context Menu
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu items
  chrome.contextMenus.create({
    id: 'ai-ulu-capture',
    title: '🧠 StackMemory: Hafızaya Kaydet',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'ai-ulu-capture-link',
    title: '🧠 StackMemory: Bu Linki Kaydet',
    contexts: ['link'],
  });

  chrome.contextMenus.create({
    id: 'ai-ulu-capture-image',
    title: '🧠 StackMemory: Bu Görseli Kaydet',
    contexts: ['image'],
  });

  console.log('StackMemory extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const stored = await chrome.storage.local.get(['apiKey', 'apiUrl']);
  
  if (!stored.apiKey) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'StackMemory',
      message: 'Önce giriş yapmalısınız. Extension popup\'ını açın.',
    });
    return;
  }

  const apiUrl = stored.apiUrl || CONFIG.apiUrl;
  let content = '';
  let type = 'fact';

  switch (info.menuItemId) {
    case 'ai-ulu-capture':
      content = info.selectionText;
      break;
    case 'ai-ulu-capture-link':
      content = `Link: ${info.linkUrl}`;
      break;
    case 'ai-ulu-capture-image':
      content = `Görsel: ${info.srcUrl}`;
      break;
  }

  if (!content) return;

  try {
    const response = await fetch(`${apiUrl}/api/extension/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${stored.apiKey}`,
      },
      body: JSON.stringify({
        content,
        url: tab.url,
        title: tab.title,
        selectedText: content,
        autoProcess: true,
      }),
    });

    if (response.ok) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'StackMemory ✨',
        message: 'Hafızaya kaydedildi!',
      });
    } else {
      throw new Error('Capture failed');
    }
  } catch (error) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'StackMemory Hatası',
      message: 'Kayıt başarısız oldu.',
    });
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'capture-selection') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) return;

    // Get selected text
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString(),
    });

    if (result?.result) {
      const stored = await chrome.storage.local.get(['apiKey', 'apiUrl']);
      
      if (!stored.apiKey) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'StackMemory',
          message: 'Önce giriş yapmalısınız.',
        });
        return;
      }

      const apiUrl = stored.apiUrl || CONFIG.apiUrl;

      try {
        const response = await fetch(`${apiUrl}/api/extension/capture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${stored.apiKey}`,
          },
          body: JSON.stringify({
            content: result.result,
            url: tab.url,
            title: tab.title,
            selectedText: result.result,
            autoProcess: true,
          }),
        });

        if (response.ok) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'StackMemory ✨',
            message: 'Seçili metin hafızaya kaydedildi!',
          });
        }
      } catch (error) {
        console.error('Capture error:', error);
      }
    } else {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'StackMemory',
        message: 'Önce bir metin seçin.',
      });
    }
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAPTURE_MEMORY') {
    handleCaptureFromContent(message, sender.tab);
    sendResponse({ received: true });
  }
  return true;
});

async function handleCaptureFromContent(message, tab) {
  const stored = await chrome.storage.local.get(['apiKey', 'apiUrl']);
  
  if (!stored.apiKey) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'StackMemory',
      message: 'Önce giriş yapmalısınız.',
    });
    return;
  }

  const apiUrl = stored.apiUrl || CONFIG.apiUrl;

  try {
    const response = await fetch(`${apiUrl}/api/extension/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${stored.apiKey}`,
      },
      body: JSON.stringify({
        content: message.content,
        url: tab?.url,
        title: tab?.title,
        selectedText: message.content,
        autoProcess: true,
      }),
    });

    if (response.ok) {
      // Send success message to content script
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'CAPTURE_SUCCESS',
          message: 'Hafızaya kaydedildi!',
        });
      }
    }
  } catch (error) {
    console.error('Background capture error:', error);
  }
}

// Badge update on storage change
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.apiKey) {
    if (changes.apiKey.newValue) {
      chrome.action.setBadgeText({ text: '✓' });
      chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }
});
