// Model configuration utility
export function getModelConfig() {
  // Check if custom endpoint is configured
  if (process.env.CUSTOM_MODEL_ENDPOINT) {
    return {
      endpoint: process.env.CUSTOM_MODEL_ENDPOINT,
      apiKey: process.env.CUSTOM_MODEL_API_KEY || '',
      models: {
        'nemotron-70b': 'nemotron-70b-instruct',
        'llama-3.1-70b': 'llama-3.1-70b-instruct',
        'mistral-large': 'mistral-large',
        'gpt-4o': 'gpt-4o',
        'claude-sonnet': 'claude-3-5-sonnet-20241022',
      },
    };
  }

  // Check if OpenRouter is configured
  if (process.env.OPENROUTER_API_KEY) {
    return {
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: process.env.OPENROUTER_API_KEY,
      models: {
        'nemotron-70b': 'nvidia/llama-3.1-nemotron-70b-instruct',
        'llama-3.1-70b': 'meta-llama/llama-3.1-70b-instruct',
        'mistral-large': 'mistralai/mistral-large',
        'gpt-4o': 'openai/gpt-4o',
        'claude-sonnet': 'anthropic/claude-3.5-sonnet',
      },
    };
  }

  // Default to Emergent/OpenAI compatible endpoint
  return {
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
  };
}

export const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'En güçlü OpenAI modeli' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Hızlı ve ekonomik' },
  { id: 'claude-sonnet', name: 'Claude Sonnet', description: 'Anthropic\'in son modeli' },
  { id: 'gemini-flash', name: 'Gemini Flash', description: 'Google\'dan hızlı model' },
];