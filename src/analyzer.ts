/**
 * Analyzes the given code snippet for vulnerabilities using the OpenRouter AI API.
 * @param code The code snippet to analyze.
 * @returns A promise that resolves with the analysis results as a string.
 */
export async function analyzeCode(code: string): Promise<string> {
  // 1. Retrieve the API key from environment variables
  // const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY; // No longer used, handled by backend proxy

  // 2. Check if the API key is available
  // if (!apiKey) {
  //   console.warn("OpenRouter API Key is missing. Please check environment variables or build configuration.");
  //   // Use a more user-friendly error for missing configuration
  //   throw new Error("OpenRouter integration is not properly configured. The application will use local analysis instead.");
  // }

  const openRouterApiUrl = "https://codesafe-openrouter-proxy-vyom-pandyas-projects.vercel.app/api/openrouter";
  const siteUrl = window.location.origin; // Get the site URL for the Referer header
  const appName = "Code Vulnerability Analyzer"; // Set your app name for the X-Title header

  try {
    const response = await fetch(openRouterApiUrl, {
      method: "POST",
      headers: {
        // 3. Correctly format the Authorization header
        // "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // 4. Add recommended OpenRouter headers
        "HTTP-Referer": siteUrl,
        "X-Title": appName,
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo", // Specify the model you want to use
        messages: [
          {
            role: "system",
            content: "You are an expert security analyst. Analyze the following code for vulnerabilities, security flaws, and potential bugs. Provide a detailed report including the type of vulnerability, its location (line number if possible), and suggestions for fixing it.",
          },
          {
            role: "user",
            content: `Analyze this code:\n\n\`\`\`\n${code}\n\`\`\``,
          },
        ],
      }),
    });

    // Check if the response status indicates an error
    if (!response.ok) {
      const errorDetails = await response.json().catch(() => ({})); // Try to parse error details, default to empty object
      console.error("OpenRouter API error details:", errorDetails); // Log details (line 89 in original trace)

      // 5. Provide specific feedback for 401 Unauthorized errors
      if (response.status === 401) {
        throw new Error("OpenRouter API error: Authentication failed. Please check if your API key is correct and valid."); // More specific error (replaces generic error at line 96)
      }
      // Throw a general error for other HTTP issues
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract the analysis from the response
    const analysis = data.choices?.[0]?.message?.content;
    if (!analysis) {
      console.error("Could not extract analysis from OpenRouter response:", data);
      throw new Error("Failed to get analysis from OpenRouter.");
    }

    return analysis.trim();

  } catch (error: unknown) {
    // Log the caught error (line 155 in original trace)
    console.error("Error analyzing code with AI:", error);

    // Re-throw the error to be handled by the caller (e.g., in App.tsx)
    if (error instanceof Error) {
      // Re-throw specific errors or a generic one
      throw new Error(`Error during AI analysis: ${error.message}`);
    } else {
      // Handle non-Error objects being thrown
      throw new Error("An unknown error occurred during AI analysis.");
    }
  }
} 