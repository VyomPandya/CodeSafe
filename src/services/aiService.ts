// AI Service for handling code enhancement features

/**
 * Gets the OpenRouter API key from environment variables
 * (No longer used, calls go through backend proxy)
 */
export const getApiKey = (): string => '';

/**
 * Initializes the AI client (no key needed on frontend)
 */
export const initializeAiClient = () => ({ apiKey: '' });

/**
 * Enhances code using the OpenRouter API via backend proxy
 * @param code The code to enhance
 * @param options Additional options for the enhancement
 */
export const enhanceCode = async (code: string, options = {}) => {
  const response = await fetch('https://codesafe-openrouter-proxy-vyom-pandyas-projects.vercel.app/openrouter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, ...options }),
  });
  if (!response.ok) throw new Error('Proxy error: ' + response.status);
  return (await response.json()).choices?.[0]?.message?.content;
};