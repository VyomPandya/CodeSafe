import React, { useState, useEffect } from 'react';
import { Cpu, XCircle } from 'lucide-react';

interface CodeEnhancementProps {
  fileName: string;
  originalCode: string;
}

export function CodeEnhancement({ fileName, originalCode }: CodeEnhancementProps) {
  const [suggestedCode, setSuggestedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Clear previous results when originalCode or fileName changes
  useEffect(() => {
    setSuggestedCode(null);
    setError(null);
  }, [fileName, originalCode]);

  // Function to request AI-enhanced code
  const enhanceCode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare the prompt for code enhancement
      const prompt = `
You are an expert code reviewer. Analyze this code and suggest improvements:

\`\`\`
${originalCode}
\`\`\`

Focus on:
- Improving code quality and readability
- Fixing potential bugs or edge cases
- Optimizing performance
- Following best practices

Your task is to return ONLY the improved code, with brief comments explaining the changes.
Do not include any explanations outside the code block, just return the enhanced code.
`;

      // Call the AI API (OpenRouter in this case)
      const response = await fetch('https://codesafe-openrouter-proxy-vyom-pandyas-projects.vercel.app/openrouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Code Vulnerability Analyzer',
        },
        body: JSON.stringify({
          model: 'nvidia/llama-3.1-nemotron-nano-8b-v1:free', // Use the free Mistral model
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1, // Lower temperature for more precise code improvements
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Extract code from the response (in case the AI included explanations)
      let enhancedCodeResult = aiResponse;
      const codeBlockRegex = /```(?:\w*\n)?([^`]+)```/s;
      const match = aiResponse.match(codeBlockRegex);
      
      if (match && match[1]) {
        enhancedCodeResult = match[1].trim();
      }
      
      setSuggestedCode(enhancedCodeResult);
    } catch (error) {
      console.error('Error enhancing code:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 bg-white rounded-lg shadow p-4">
      <div className="mb-4">
        <button
          onClick={enhanceCode}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enhancing code...
            </span>
          ) : (
            <>
              <Cpu className="h-4 w-4 mr-2" />
              AI Code Enhancement
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative flex items-center">
          <XCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {suggestedCode && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Enhanced Code:</h4>
          <div className="bg-gray-50 rounded-md p-4 overflow-auto">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">
              {suggestedCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 