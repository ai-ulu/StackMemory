/**
 * AI-ULU Chrome Extension - Content Script
 * Injects UI elements for quick memory capture
 */

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.__aiUluInjected) return;
  window.__aiUluInjected = true;

  // Create floating capture button
  const captureButton = document.createElement('div');
  captureButton.id = 'ai-ulu-capture-btn';
  captureButton.innerHTML = '🧠';
  captureButton.title = 'AI-ULU: Seçili metni kaydet';
  captureButton.style.cssText = `
    display: none;
    position: fixed;
    z-index: 2147483647;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #8B5CF6, #7C3AED);
    color: white;
    font-size: 20px;
    line-height: 40px;
    text-align: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
    transition: transform 0.2s, box-shadow 0.2s;
    user-select: none;
  `;

  document.body.appendChild(captureButton);

  // Show button on text selection
  document.addEventListener('mouseup', (e) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 5) {
      // Position near selection
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      captureButton.style.display = 'block';
      captureButton.style.left = `${Math.min(rect.right + 10, window.innerWidth - 50)}px`;
      captureButton.style.top = `${Math.max(rect.top - 20, 10)}px`;
      
      // Store selected text
      captureButton.dataset.text = selectedText;
    } else {
      // Hide if clicked elsewhere (not on button)
      if (!e.target.closest('#ai-ulu-capture-btn')) {
        setTimeout(() => {
          if (!captureButton.matches(':hover')) {
            captureButton.style.display = 'none';
          }
        }, 200);
      }
    }
  });

  // Hide on scroll
  document.addEventListener('scroll', () => {
    captureButton.style.display = 'none';
  }, { passive: true });

  // Handle button click
  captureButton.addEventListener('click', (e) => {
    e.stopPropagation();
    
    const text = captureButton.dataset.text;
    if (!text) return;

    // Show saving indicator
    captureButton.innerHTML = '⏳';
    captureButton.style.pointerEvents = 'none';

    // Send to background script
    chrome.runtime.sendMessage({
      type: 'CAPTURE_MEMORY',
      content: text,
    }, (response) => {
      if (chrome.runtime.lastError) {
        showNotification('Kayıt hatası', 'error');
      }
    });

    // Reset button
    setTimeout(() => {
      captureButton.innerHTML = '🧠';
      captureButton.style.pointerEvents = 'auto';
      captureButton.style.display = 'none';
    }, 500);
  });

  // Hover effect
  captureButton.addEventListener('mouseenter', () => {
    captureButton.style.transform = 'scale(1.1)';
    captureButton.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.5)';
  });

  captureButton.addEventListener('mouseleave', () => {
    captureButton.style.transform = 'scale(1)';
    captureButton.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
  });

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CAPTURE_SUCCESS') {
      showNotification(message.message || 'Kaydedildi!', 'success');
    } else if (message.type === 'CAPTURE_ERROR') {
      showNotification(message.message || 'Hata oluştu', 'error');
    }
  });

  // Notification helper
  function showNotification(text, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'ai-ulu-notification';
    notification.innerHTML = `
      <span class="ai-ulu-notification-icon">${type === 'success' ? '✨' : '❌'}</span>
      <span class="ai-ulu-notification-text">${text}</span>
    `;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: ${type === 'success' ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #EF4444, #DC2626)'};
      color: white;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      animation: ai-ulu-slide-in 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'ai-ulu-slide-out 0.3s ease forwards';
      setTimeout(() => notification.remove(), 300);
    }, 2500);
  }

  // Add animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ai-ulu-slide-in {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes ai-ulu-slide-out {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100px);
      }
    }
  `;
  document.head.appendChild(style);

})();
