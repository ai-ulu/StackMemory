/**
 * StackMemory Model Configuration
 * 
 * Supports multiple API providers:
 * 1. LiteLLM (recommended - unified interface)
 * 2. OpenRouter (100+ models)
 * 3. EmergentMethods (default)
 * 4. Direct OpenAI
 * 5. Custom endpoints
 */
import { getConfiguredAppUrl } from '@/lib/app-url';

const appUrl = getConfiguredAppUrl() || 'https://stackmemory.dev';

// Provider detection priority
export function getModelConfig() {
  // 1. LiteLLM - Recommended for multi-model support
  if (process.env.LITELLM_API_URL) {
    return {
      provider: 'litellm',
      endpoint: `${process.env.LITELLM_API_URL}/chat/completions`,
      apiKey: process.env.LITELLM_API_KEY || '',
      models: {
        'gpt-4o': 'gpt-4o',
        'gpt-4o-mini': 'gpt-4o-mini',
        'claude-sonnet': 'claude-3-5-sonnet-20241022',
        'gemini-pro': 'gemini-pro',
        'mistral-large': 'mistral-large-latest',
        'llama-3.1-70b': 'together_ai/meta-llama/Llama-3.1-70B-Instruct-Turbo',
      },
      headers: {
        'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`,
      },
    };
  }

  // 2. OpenRouter - 100+ models
  if (process.env.OPENROUTER_API_KEY) {
    return {
      provider: 'openrouter',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: process.env.OPENROUTER_API_KEY,
      models: {
        'gpt-4o': 'openai/gpt-4o',
        'gpt-4o-mini': 'openai/gpt-4o-mini',
        'claude-sonnet': 'anthropic/claude-3.5-sonnet',
        'gemini-pro': 'google/gemini-pro-1.5',
        'mistral-large': 'mistralai/mistral-large',
        'llama-3.1-70b': 'meta-llama/llama-3.1-70b-instruct',
        'deepseek': 'deepseek/deepseek-chat',
      },
      headers: {
        'HTTP-Referer': appUrl,
        'X-Title': 'StackMemory',
      },
    };
  }

  // 3. Custom endpoint (for self-hosted models)
  if (process.env.CUSTOM_MODEL_ENDPOINT) {
    return {
      provider: 'custom',
      endpoint: process.env.CUSTOM_MODEL_ENDPOINT,
      apiKey: process.env.CUSTOM_MODEL_API_KEY || '',
      models: JSON.parse(process.env.CUSTOM_MODELS || '{"default": "default"}'),
      headers: {},
    };
  }

  // 4. EmergentMethods (default) / OpenAI compatible
  return {
    provider: 'emergent',
    endpoint: process.env.OPENAI_BASE_URL 
      ? `${process.env.OPENAI_BASE_URL}/chat/completions`
      : 'https://api.emergentmethods.ai/v1/chat/completions',
    apiKey: process.env.OPENAI_API_KEY || '',
    models: {
      'gpt-4o': 'gpt-4o',
      'gpt-4o-mini': 'gpt-4o-mini',
      'claude-sonnet': 'claude-sonnet-4-20250514',
      'gemini-flash': 'gemini-2.0-flash',
    },
    headers: {},
  };
}

// Get embedding config (separate from chat)
export function getEmbeddingConfig() {
  // LiteLLM for embeddings
  if (process.env.LITELLM_API_URL) {
    return {
      endpoint: `${process.env.LITELLM_API_URL}/embeddings`,
      apiKey: process.env.LITELLM_API_KEY || '',
      model: 'text-embedding-3-small',
    };
  }

  // Default
  return {
    endpoint: process.env.OPENAI_BASE_URL 
      ? `${process.env.OPENAI_BASE_URL}/embeddings`
      : 'https://api.emergentmethods.ai/v1/embeddings',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'text-embedding-3-small',
  };
}

// Available models for UI dropdown
export const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'En güçlü OpenAI modeli', tier: 'premium' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Hızlı ve ekonomik', tier: 'standard' },
  { id: 'claude-sonnet', name: 'Claude Sonnet', description: 'Anthropic\'in son modeli', tier: 'premium' },
  { id: 'gemini-flash', name: 'Gemini Flash', description: 'Google\'dan hızlı model', tier: 'standard' },
  { id: 'mistral-large', name: 'Mistral Large', description: 'Avrupa\'nın güçlü modeli', tier: 'premium' },
  { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', description: 'Meta\'nın açık kaynak modeli', tier: 'standard' },
];

// Provider info for settings page
export const API_PROVIDERS = [
  { 
    id: 'litellm', 
    name: 'LiteLLM', 
    description: 'Tek API ile 100+ model (Önerilen)',
    docs: 'https://docs.litellm.ai',
    envVars: ['LITELLM_API_URL', 'LITELLM_API_KEY'],
  },
  { 
    id: 'openrouter', 
    name: 'OpenRouter', 
    description: 'Marketplace - tüm modellere erişim',
    docs: 'https://openrouter.ai/docs',
    envVars: ['OPENROUTER_API_KEY'],
  },
  { 
    id: 'emergent', 
    name: 'EmergentMethods', 
    description: 'Varsayılan API sağlayıcı',
    docs: 'https://emergentmethods.ai',
    envVars: ['OPENAI_API_KEY', 'OPENAI_BASE_URL'],
  },
  { 
    id: 'custom', 
    name: 'Custom Endpoint', 
    description: 'Kendi sunucunuz (Ollama, vLLM, etc.)',
    docs: null,
    envVars: ['CUSTOM_MODEL_ENDPOINT', 'CUSTOM_MODEL_API_KEY'],
  },
];
