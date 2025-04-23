// AI Service for handling code enhancement features

/**
 * Gets the OpenRouter API key from environment variables
 */
export const getApiKey = (): string => {
  let apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  // GitHub Pages workaround - check window object lookup if available
  if (!apiKey && typeof window !== 'undefined' && window._env_) {
    if (window._env_.OPENROUTER_API_KEY) {
      apiKey = window._env_.OPENROUTER_API_KEY;
    }
  }
  return apiKey;
};

/**
 * Initializes the AI client with the OpenRouter API key
 */
export const initializeAiClient = () => {
  const apiKey = getApiKey();
  return { apiKey };
};

/**
 * Enhances code using the OpenRouter API
 * @param code The code to enhance
 * @param options Additional options for the enhancement
 */
export const enhanceCode = async (code: string, options = {}) => {
  const config = initializeAiClient();
  if (!config.apiKey) throw new Error('OpenRouter API key not found.');
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'HTTP-Referer': window.location.origin,
    },
    body: JSON.stringify({
      model: options.model || 'openai/gpt-4',
      messages: [
        { role: 'system', content: 'You are an AI assistant that enhances code.' },
        { role: 'user', content: `Enhance this code: ${code}` }
      ],
      ...options
    })
  });
  if (!response.ok) throw new Error('OpenRouter API error: ' + response.status);
  return (await response.json()).choices?.[0]?.message?.content;
};