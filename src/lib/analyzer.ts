import { VulnerabilityResult } from '../components/AnalysisResult';

// Make sure the window._env_ type is properly defined
declare global {
  interface Window {
    _env_?: {
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
    };
  }
}

/**
 * This function sends code to the backend proxy for vulnerability analysis
 * @param file The uploaded code file
 * @param model The OpenRouter AI model to use for analysis
 * @returns Promise with vulnerability analysis results
 */
export async function analyzeCode(file: File, model = 'nvidia/llama-3.1-nemotron-nano-8b-v1:free'): Promise<VulnerabilityResult[]> {
  const content = await file.text();
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  try {
    const response = await fetch('https://codesafe-openrouter-proxy-vyom-pandyas-projects.vercel.app/api/openrouter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: content,
        model,
        fileExtension,
        filename: file.name,
      }),
    });
    if (!response.ok) throw new Error('Proxy error: ' + response.status);
    // If your proxy returns a structure like { choices: [{ message: { content: ... } }] }, parse accordingly
    const data = await response.json();
    // You may need to adapt this if your backend returns a different structure
    return data.choices?.[0]?.message?.content || data;
  } catch (error) {
    // Optionally: fallback to local analysis or rethrow
    throw error;
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