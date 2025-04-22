const m="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";async function g(e,a="google/gemini-2.5-pro-exp-03-25:free"){var l,s;const u=await e.text(),n=(l=e.name.split(".").pop())==null?void 0:l.toLowerCase();console.log(`Analyzing code using model: ${a}`);try{const i=`
You are a code security expert analyzing code for vulnerabilities.
Analyze this ${n} code and identify security issues:

\`\`\`${n}
${u}
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
`,t=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${m}`,"HTTP-Referer":window.location.origin,"X-Title":"Code Vulnerability Analyzer"},body:JSON.stringify({model:a,messages:[{role:"user",content:i}],temperature:.1,max_tokens:2048})});if(!t.ok){const r=await t.json().catch(()=>({}));return console.error("OpenRouter API error details:",r),console.error("OpenRouter API error status:",t.status,t.statusText),t.status===429?console.warn("Rate limit reached for free model. Falling back to local analysis."):t.status===401?console.warn("OpenRouter API authentication failed. Check if your API key is valid and correctly configured. Falling back to local analysis."):console.warn(`OpenRouter API error: ${((s=r.error)==null?void 0:s.message)||t.statusText}. Falling back to local analysis.`),d(u,n||"",e.name)}const c=(await t.json()).choices[0].message.content;try{let r=[];try{r=JSON.parse(c)}catch{const p=c.match(/\[\s*\{.*\}\s*\]/s);if(p)r=JSON.parse(p[0]);else throw console.log("AI response:",c),new Error("Could not parse analysis results from AI response")}if(!Array.isArray(r))throw new Error("AI response did not contain valid analysis results array");if(r.length===0)return console.log("No vulnerabilities found in the code"),[];if(!r.every(o=>o.severity&&o.message&&(typeof o.line=="number"||typeof o.line=="string")))throw new Error("Analysis results missing required properties");return r.map(o=>({...o,line:typeof o.line=="string"?parseInt(o.line,10)||1:o.line||1}))}catch(r){return console.error("Error parsing AI response:",r),console.log("Raw AI response:",c),console.warn("Could not parse analysis results from AI response. Falling back to local analysis."),d(u,n||"",e.name)}}catch(i){return console.error("Error analyzing code with AI:",i),d(u,n||"",e.name)}}function d(e,a,u){const n=[];if(a==="js"||a==="ts"||a==="jsx"||a==="tsx"){e.includes("eval(")&&n.push({severity:"high",message:"Use of eval() can be dangerous and lead to code injection vulnerabilities",line:e.split(`
`).findIndex(i=>i.includes("eval("))+1,rule:"no-eval",improvement:"Replace eval() with safer alternatives such as Function constructor or JSON.parse() for JSON data. Consider restructuring your code to avoid dynamic code execution."}),e.includes("dangerouslySetInnerHTML")&&n.push({severity:"high",message:"dangerouslySetInnerHTML can lead to XSS vulnerabilities",line:e.split(`
`).findIndex(i=>i.includes("dangerouslySetInnerHTML"))+1,rule:"no-dangerous-html",improvement:"Use safer alternatives like React components and props. If you must use HTML, ensure all user input is properly sanitized using a library like DOMPurify."}),e.includes("innerHTML")&&n.push({severity:"medium",message:"Use of innerHTML can lead to XSS vulnerabilities",line:e.split(`
`).findIndex(i=>i.includes("innerHTML"))+1,rule:"no-inner-html",improvement:"Use safer DOM manipulation methods like textContent or createElement() and appendChild(). For frameworks like React, use their built-in components and props system."});const l=/password.*=.*['"][^'"]*['"]/i;l.test(e)&&n.push({severity:"medium",message:"Hardcoded password detected",line:e.split(`
`).findIndex(i=>l.test(i))+1,rule:"no-hardcoded-secrets",improvement:"Use environment variables or a secure vault service to store sensitive information. Never hardcode secrets in your source code."}),e.split(`
`).map((i,t)=>({line:i,index:t})).filter(({line:i})=>i.includes("console.log")).forEach(({index:i})=>{n.push({severity:"low",message:"Console statements should be removed in production code",line:i+1,rule:"no-console",improvement:"Remove console.log statements or replace with proper logging that can be disabled in production. Consider using a logging library that supports different log levels."})}),(e.includes("TODO")||e.includes("FIXME"))&&n.push({severity:"low",message:"TODO or FIXME comment found",line:e.split(`
`).findIndex(i=>i.includes("TODO")||i.includes("FIXME"))+1,rule:"no-todo-comments",improvement:"Address the TODO/FIXME comments before deploying to production. If it's a known limitation, document it properly and create an issue in your project management system."})}return a==="py"&&(e.includes("exec(")&&n.push({severity:"high",message:"Use of exec() can lead to code injection vulnerabilities",line:e.split(`
`).findIndex(s=>s.includes("exec("))+1,rule:"no-exec",improvement:"Avoid using exec() entirely. Restructure your code to use more specific functions or modules that perform the required functionality without executing arbitrary code."}),e.includes("pickle.loads")&&n.push({severity:"high",message:"Unsafe deserialization using pickle can lead to code execution",line:e.split(`
`).findIndex(s=>s.includes("pickle.loads"))+1,rule:"no-unsafe-deserialization",improvement:"Use safer serialization alternatives like JSON, YAML, or MessagePack. If pickle is necessary, only unpickle data from trusted sources and consider using safer modules like marshmallow."}),e.split(`
`).map((s,i)=>({line:s,index:i})).filter(({line:s})=>s.includes("input(")).forEach(({index:s})=>{n.push({severity:"medium",message:"Input should be type-checked and sanitized",line:s+1,rule:"validate-input",improvement:"Always validate and sanitize user input. Use type conversion functions like int() or float() with try/except blocks, or use input validation libraries like Pydantic."})}),e.includes("shell=True")&&n.push({severity:"medium",message:"Using shell=True with subprocess can be dangerous",line:e.split(`
`).findIndex(s=>s.includes("shell=True"))+1,rule:"no-shell-true",improvement:"Avoid using shell=True with subprocess. Instead, pass the command as a list of arguments and set shell=False (the default). This prevents shell injection attacks."})),a==="java"&&(e.includes("Runtime.getRuntime().exec(")&&n.push({severity:"high",message:"Using Runtime.exec() can be dangerous for command execution",line:e.split(`
`).findIndex(s=>s.includes("Runtime.getRuntime().exec("))+1,rule:"no-runtime-exec",improvement:"Use ProcessBuilder instead, which has better security features. Always validate and sanitize any user input that goes into command execution."}),e.includes("printStackTrace")&&n.push({severity:"medium",message:"printStackTrace exposes implementation details",line:e.split(`
`).findIndex(s=>s.includes("printStackTrace"))+1,rule:"no-stacktrace-print",improvement:"Use a proper logging framework like SLF4J or Log4j. Pass exceptions to the logger rather than printing stack traces directly."}),e.split(`
`).map((s,i)=>({line:s,index:i})).filter(({line:s})=>s.includes("System.out.println")).forEach(({index:s})=>{n.push({severity:"low",message:"System.out.println should be replaced with proper logging",line:s+1,rule:"use-logger",improvement:"Replace System.out.println with a proper logging framework like SLF4J or Log4j. This provides better control over log levels and output destinations."})}),(e.includes(" == null")||e.includes(" != null"))&&n.push({severity:"low",message:"Consider using Optional to handle null values",line:e.split(`
`).findIndex(s=>s.includes(" == null")||s.includes(" != null"))+1,rule:"use-optional",improvement:"Use Java's Optional<T> type to represent optional values instead of null checks. This makes the API more explicit and helps prevent NullPointerExceptions."})),n}export{g as analyzeCode};
