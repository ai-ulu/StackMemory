/**
 * AI-ULU Voice Memory Module
 * 
 * Speech-to-text for voice input
 * Text-to-speech for memory playback
 */

// Speech recognition instance
let recognition = null;
let isListening = false;
let onResultCallback = null;
let onErrorCallback = null;

/**
 * Check if browser supports speech recognition
 */
export function isSpeechSupported() {
  return typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

/**
 * Check if browser supports speech synthesis
 */
export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Initialize speech recognition
 */
export function initSpeechRecognition(options = {}) {
  if (!isSpeechSupported()) {
    console.warn('Speech recognition not supported');
    return false;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();

  // Configure
  recognition.lang = options.lang || 'tr-TR';
  recognition.continuous = options.continuous || false;
  recognition.interimResults = options.interimResults || true;
  recognition.maxAlternatives = 1;

  // Event handlers
  recognition.onresult = (event) => {
    const results = event.results;
    const lastResult = results[results.length - 1];
    
    if (lastResult.isFinal) {
      const transcript = lastResult[0].transcript;
      const confidence = lastResult[0].confidence;
      
      if (onResultCallback) {
        onResultCallback({
          text: transcript,
          confidence,
          isFinal: true,
        });
      }
    } else {
      // Interim result
      const interim = lastResult[0].transcript;
      if (onResultCallback) {
        onResultCallback({
          text: interim,
          confidence: lastResult[0].confidence,
          isFinal: false,
        });
      }
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    isListening = false;
    
    if (onErrorCallback) {
      onErrorCallback({
        error: event.error,
        message: getErrorMessage(event.error),
      });
    }
  };

  recognition.onend = () => {
    isListening = false;
  };

  return true;
}

/**
 * Start listening
 */
export function startListening(onResult, onError) {
  if (!recognition) {
    const initialized = initSpeechRecognition();
    if (!initialized) {
      onError?.({ error: 'not-supported', message: 'Tarayıcınız ses tanımayı desteklemiyor' });
      return false;
    }
  }

  onResultCallback = onResult;
  onErrorCallback = onError;

  try {
    recognition.start();
    isListening = true;
    return true;
  } catch (error) {
    console.error('Failed to start recognition:', error);
    return false;
  }
}

/**
 * Stop listening
 */
export function stopListening() {
  if (recognition && isListening) {
    recognition.stop();
    isListening = false;
  }
}

/**
 * Check if currently listening
 */
export function getIsListening() {
  return isListening;
}

/**
 * Speak text aloud (Text-to-Speech)
 */
export function speakText(text, options = {}) {
  if (!isSpeechSynthesisSupported()) {
    console.warn('Speech synthesis not supported');
    return false;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Configure
  utterance.lang = options.lang || 'tr-TR';
  utterance.rate = options.rate || 1;
  utterance.pitch = options.pitch || 1;
  utterance.volume = options.volume || 1;

  // Find Turkish voice if available
  const voices = window.speechSynthesis.getVoices();
  const turkishVoice = voices.find(v => v.lang.startsWith('tr'));
  if (turkishVoice) {
    utterance.voice = turkishVoice;
  }

  // Event handlers
  utterance.onend = () => {
    options.onEnd?.();
  };

  utterance.onerror = (event) => {
    options.onError?.(event);
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Stop speaking
 */
export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Get available voices
 */
export function getVoices() {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
}

/**
 * Voice command parser
 * Recognizes commands like:
 * - "Kaydet: [içerik]" - Save memory
 * - "Ara: [sorgu]" - Search memories
 * - "Hatırla: [konu]" - Query memories
 */
export function parseVoiceCommand(text) {
  const lowerText = text.toLowerCase().trim();

  // Save command
  if (lowerText.startsWith('kaydet') || lowerText.startsWith('kayıt')) {
    const content = text.replace(/^(kaydet|kayıt)[:\s]*/i, '').trim();
    return { command: 'save', content };
  }

  // Search command
  if (lowerText.startsWith('ara') || lowerText.startsWith('bul')) {
    const query = text.replace(/^(ara|bul)[:\s]*/i, '').trim();
    return { command: 'search', query };
  }

  // Remember/Query command
  if (lowerText.startsWith('hatırla') || lowerText.startsWith('ne biliyorsun')) {
    const topic = text.replace(/^(hatırla|ne biliyorsun)[:\s]*/i, '').trim();
    return { command: 'query', topic };
  }

  // Read command
  if (lowerText.startsWith('oku') || lowerText.startsWith('seslendir')) {
    return { command: 'read' };
  }

  // No recognized command - treat as general input
  return { command: 'input', text };
}

/**
 * Get error message in Turkish
 */
function getErrorMessage(error) {
  const messages = {
    'no-speech': 'Ses algılanamadı. Lütfen tekrar deneyin.',
    'audio-capture': 'Mikrofon erişimi sağlanamadı.',
    'not-allowed': 'Mikrofon izni verilmedi.',
    'network': 'Ağ hatası oluştu.',
    'aborted': 'İşlem iptal edildi.',
    'language-not-supported': 'Dil desteklenmiyor.',
  };
  return messages[error] || 'Bir hata oluştu.';
}

/**
 * Voice Memory React Hook
 */
export function useVoiceMemory() {
  const [isSupported, setIsSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsSupported(isSpeechSupported());
  }, []);

  const startVoice = useCallback(() => {
    setError(null);
    setTranscript('');
    
    const success = startListening(
      (result) => {
        setTranscript(result.text);
        if (result.isFinal) {
          setListening(false);
        }
      },
      (err) => {
        setError(err.message);
        setListening(false);
      }
    );

    if (success) {
      setListening(true);
    }
  }, []);

  const stopVoice = useCallback(() => {
    stopListening();
    setListening(false);
  }, []);

  return {
    isSupported,
    listening,
    transcript,
    error,
    startVoice,
    stopVoice,
    speakText,
    parseVoiceCommand,
  };
}

// For React useState/useEffect
import { useState, useEffect, useCallback } from 'react';
