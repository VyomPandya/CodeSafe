import { VulnerabilityResult } from '../components/AnalysisResult';
import { getApiKey } from '../services/aiService';

// Make sure the window._env_ type is properly defined
declare global {
  interface Window {
    _env_?: {
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
    };
  }
}

// Get the API key using the centralized function
const getOpenRouterApiKey = () => {
  return getApiKey();
};

// Log more detailed API key info in development mode only
if (import.meta.env.DEV) {
  const apiKey = getOpenRouterApiKey();
  if (apiKey) {
    console.log(`OpenRouter API key found (starts with: ${apiKey.substring(0, 5)}...)`);
  } else {
    console.log('No OpenRouter API key found');
  }
}

/**
 * This function sends code to OpenRouter API for vulnerability analysis
 * @param file The uploaded code file
 * @param model The OpenRouter AI model to use for analysis
 * @returns Promise with vulnerability analysis results
 */
export async function analyzeCode(file: File, model = 'nvidia/llama-3.1-nemotron-nano-8b-v1:free'): Promise<VulnerabilityResult[]> {
  const content = await file.text();
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  console.log(`Analyzing code using model: ${model}`);
  
  try {
    // Prepare the optimized prompt for the code analysis model
    const prompt = `
You are a code security expert analyzing code for vulnerabilities.
Analyze this ${fileExtension} code and identify security issues:

\`\`\`${fileExtension}
${content}
\`\`\`

Your task is to return ONLY a JSON array of objects with these exact properties:
- severity: Must be exactly one of "high", "medium", or "low"
- message: A brief description of the vulnerability
- line: The line number where the issue occurs (as a number)
- rule: A short identifier for the type of vulnerability
- improvement: Specific actionable advice to fix the issue

Focus on:
- Security vulnerabilities (XSS, injections, etc.)
- Unsafe practices (eval, exec, etc.)
- Hardcoded credentials
- Input validation issues
- Insecure API usage patterns

IMPORTANT: 
1. Return valid JSON and nothing else
2. No explanations, markdown formatting, or any text before or after the JSON
3. The JSON array should look like this:
[
  {
    "severity": "high",
    "message": "Use of eval() can lead to code injection",
    "line": 42,
    "rule": "no-eval",
    "improvement": "Replace eval() with safer alternatives"
  },
  {
    "severity": "medium",
    "message": "Unvalidated user input",
    "line": 27,
    "rule": "validate-input",
    "improvement": "Add input validation before processing"
  }
]
`;

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getOpenRouterApiKey()}`,
        'HTTP-Referer': window.location.origin, // Required by OpenRouter
        'X-Title': 'Code Vulnerability Analyzer', // Helpful for tracking in OpenRouter
      },
      body: JSON.stringify({
        model: model, // Use the provided model parameter
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1, // Lower temperature for more precise code analysis
        max_tokens: 2048, // Limit response size
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API error details:', errorData);
      console.error('OpenRouter API error status:', response.status, response.statusText);
      
      // Log full details in development only
      if (import.meta.env.DEV) {
        console.error('OpenRouter API request headers:', {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer [REDACTED]', // Never log API key even partially
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Code Vulnerability Analyzer'
        });
        console.error('OpenRouter API request URL:', 'https://openrouter.ai/api/v1/chat/completions');
      }
      
      // Instead of throwing errors, log a warning and fall back to local analysis
      if (response.status === 429) {
        console.warn('Rate limit reached for free model. Falling back to local analysis.');
      } else if (response.status === 401) {
        console.warn('OpenRouter API authentication failed. Check if your API key is valid and correctly configured. Falling back to local analysis.');
      } else {
        console.warn(`OpenRouter API error: ${errorData.error?.message || response.statusText}. Falling back to local analysis.`);
      }
      
      // Use local analysis as fallback
      return performLocalAnalysis(content, fileExtension || '', file.name);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Parse JSON from response
    try {
      let analysisResults: VulnerabilityResult[] = [];
      
      // First, try to parse the entire response as JSON
      try {
        analysisResults = JSON.parse(aiResponse) as VulnerabilityResult[];
      } catch (parseError) {
        // If that fails, try to extract JSON array using regex
        const jsonMatch = aiResponse.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonMatch) {
          analysisResults = JSON.parse(jsonMatch[0]) as VulnerabilityResult[];
        } else {
          // If no valid JSON array is found, try to see if there's any JSON-like content
          console.log("AI response:", aiResponse);
          throw new Error('Could not parse analysis results from AI response');
        }
      }
      
      // Validate the structure of the results
      if (!Array.isArray(analysisResults)) {
        throw new Error('AI response did not contain valid analysis results array');
      }
      
      // Empty array is valid - it means no issues were found
      if (analysisResults.length === 0) {
        console.log('No vulnerabilities found in the code');
        return [];
      }
      
      // Verify that the results have the required properties
      const hasRequiredProps = analysisResults.every(result => 
        result.severity && result.message && 
        (typeof result.line === 'number' || typeof result.line === 'string')
      );
      
      if (!hasRequiredProps) {
        throw new Error('Analysis results missing required properties');
      }
      
      // Add line numbers if missing and ensure they are numbers
      return analysisResults.map(result => ({
        ...result,
        line: typeof result.line === 'string' ? parseInt(result.line, 10) || 1 : result.line || 1,
      }));
    } catch (parseError: unknown) {
      console.error('Error parsing AI response:', parseError);
      console.log('Raw AI response:', aiResponse);
      console.warn('Could not parse analysis results from AI response. Falling back to local analysis.');
      
      // Use local analysis as fallback for parse errors too
      return performLocalAnalysis(content, fileExtension || '', file.name);
    }
  } catch (error) {
    console.error('Error analyzing code with AI:', error);
    // Fall back to local analysis on any error
    return performLocalAnalysis(content, fileExtension || '', file.name);
  }
}

/**
 * Fallback local analysis function that doesn't require API calls
 * This is used when the OpenRouter API key is not set or when the API call fails
 */
function performLocalAnalysis(content: string, fileExtension: string, fileName: string): VulnerabilityResult[] {
  const results: VulnerabilityResult[] = [];

  // JavaScript/TypeScript analysis
  if (fileExtension === 'js' || fileExtension === 'ts' || fileExtension === 'jsx' || fileExtension === 'tsx') {
    // High severity checks
    if (content.includes('eval(')) {
      results.push({
        severity: 'high',
        message: 'Use of eval() can be dangerous and lead to code injection vulnerabilities',
        line: content.split('\n').findIndex(line => line.includes('eval(')) + 1,
        rule: 'no-eval',
        improvement: 'Replace eval() with safer alternatives such as Function constructor or JSON.parse() for JSON data. Consider restructuring your code to avoid dynamic code execution.'
      });
    }

    if (content.includes('dangerouslySetInnerHTML')) {
      results.push({
        severity: 'high',
        message: 'dangerouslySetInnerHTML can lead to XSS vulnerabilities',
        line: content.split('\n').findIndex(line => line.includes('dangerouslySetInnerHTML')) + 1,
        rule: 'no-dangerous-html',
        improvement: 'Use safer alternatives like React components and props. If you must use HTML, ensure all user input is properly sanitized using a library like DOMPurify.'
      });
    }

    // Medium severity checks
    if (content.includes('innerHTML')) {
      results.push({
        severity: 'medium',
        message: 'Use of innerHTML can lead to XSS vulnerabilities',
        line: content.split('\n').findIndex(line => line.includes('innerHTML')) + 1,
        rule: 'no-inner-html',
        improvement: 'Use safer DOM manipulation methods like textContent or createElement() and appendChild(). For frameworks like React, use their built-in components and props system.'
      });
    }

    const passwordRegex = /password.*=.*['"][^'"]*['"]/i;
    if (passwordRegex.test(content)) {
      results.push({
        severity: 'medium',
        message: 'Hardcoded password detected',
        line: content.split('\n').findIndex(line => passwordRegex.test(line)) + 1,
        rule: 'no-hardcoded-secrets',
        improvement: 'Use environment variables or a secure vault service to store sensitive information. Never hardcode secrets in your source code.'
      });
    }

    // Low severity checks
    const consoleLines = content.split('\n')
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.includes('console.log'));
    
    consoleLines.forEach(({ index }) => {
      results.push({
        severity: 'low',
        message: 'Console statements should be removed in production code',
        line: index + 1,
        rule: 'no-console',
        improvement: 'Remove console.log statements or replace with proper logging that can be disabled in production. Consider using a logging library that supports different log levels.'
      });
    });

    if (content.includes('TODO') || content.includes('FIXME')) {
      results.push({
        severity: 'low',
        message: 'TODO or FIXME comment found',
        line: content.split('\n').findIndex(line => line.includes('TODO') || line.includes('FIXME')) + 1,
        rule: 'no-todo-comments',
        improvement: 'Address the TODO/FIXME comments before deploying to production. If it\'s a known limitation, document it properly and create an issue in your project management system.'
      });
    }
  }

  // Python analysis
  if (fileExtension === 'py') {
    // High severity checks
    if (content.includes('exec(')) {
      results.push({
        severity: 'high',
        message: 'Use of exec() can lead to code injection vulnerabilities',
        line: content.split('\n').findIndex(line => line.includes('exec(')) + 1,
        rule: 'no-exec',
        improvement: 'Avoid using exec() entirely. Restructure your code to use more specific functions or modules that perform the required functionality without executing arbitrary code.'
      });
    }

    if (content.includes('pickle.loads')) {
      results.push({
        severity: 'high',
        message: 'Unsafe deserialization using pickle can lead to code execution',
        line: content.split('\n').findIndex(line => line.includes('pickle.loads')) + 1,
        rule: 'no-unsafe-deserialization',
        improvement: 'Use safer serialization alternatives like JSON, YAML, or MessagePack. If pickle is necessary, only unpickle data from trusted sources and consider using safer modules like marshmallow.'
      });
    }

    // Medium severity checks
    const inputLines = content.split('\n')
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.includes('input('));
    
    inputLines.forEach(({ index }) => {
      results.push({
        severity: 'medium',
        message: 'Input should be type-checked and sanitized',
        line: index + 1,
        rule: 'validate-input',
        improvement: 'Always validate and sanitize user input. Use type conversion functions like int() or float() with try/except blocks, or use input validation libraries like Pydantic.'
      });
    });

    if (content.includes('shell=True')) {
      results.push({
        severity: 'medium',
        message: 'Using shell=True with subprocess can be dangerous',
        line: content.split('\n').findIndex(line => line.includes('shell=True')) + 1,
        rule: 'no-shell-true',
        improvement: 'Avoid using shell=True with subprocess. Instead, pass the command as a list of arguments and set shell=False (the default). This prevents shell injection attacks.'
      });
    }
  }

  // Java analysis
  if (fileExtension === 'java') {
    // High severity checks
    if (content.includes('Runtime.getRuntime().exec(')) {
      results.push({
        severity: 'high',
        message: 'Using Runtime.exec() can be dangerous for command execution',
        line: content.split('\n').findIndex(line => line.includes('Runtime.getRuntime().exec(')) + 1,
        rule: 'no-runtime-exec',
        improvement: 'Use ProcessBuilder instead, which has better security features. Always validate and sanitize any user input that goes into command execution.'
      });
    }

    // Medium severity checks
    if (content.includes('printStackTrace')) {
      results.push({
        severity: 'medium',
        message: 'printStackTrace exposes implementation details',
        line: content.split('\n').findIndex(line => line.includes('printStackTrace')) + 1,
        rule: 'no-stacktrace-print',
        improvement: 'Use a proper logging framework like SLF4J or Log4j. Pass exceptions to the logger rather than printing stack traces directly.'
      });
    }

    // Low severity checks
    const printLines = content.split('\n')
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.includes('System.out.println'));
    
    printLines.forEach(({ index }) => {
      results.push({
        severity: 'low',
        message: 'System.out.println should be replaced with proper logging',
        line: index + 1,
        rule: 'use-logger',
        improvement: 'Replace System.out.println with a proper logging framework like SLF4J or Log4j. This provides better control over log levels and output destinations.'
      });
    });

    if (content.includes(' == null') || content.includes(' != null')) {
      results.push({
        severity: 'low',
        message: 'Consider using Optional to handle null values',
        line: content.split('\n').findIndex(line => line.includes(' == null') || line.includes(' != null')) + 1,
        rule: 'use-optional',
        improvement: 'Use Java\'s Optional<T> type to represent optional values instead of null checks. This makes the API more explicit and helps prevent NullPointerExceptions.'
      });
    }
  }

  return results;
}