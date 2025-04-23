// Script to generate runtime environment variables for GitHub Pages
const fs = require('fs');
const path = require('path');

// Get environment variables with VITE_ prefix (including OpenRouter API key)
const environmentVariables = Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .reduce((env, key) => {
    env[key] = process.env[key];
    return env;
  }, {});

// Also add non-prefixed versions for compatibility
Object.keys(environmentVariables).forEach(key => {
  if (key.startsWith('VITE_')) {
    const nonPrefixedKey = key.replace('VITE_', '');
    environmentVariables[nonPrefixedKey] = environmentVariables[key];
  }
});

// Create the output directory if it doesn't exist
const outputDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate the env-config.js file with the window._env_ object
const fileContent = `window._env_ = ${JSON.stringify(environmentVariables, null, 2)};`;
fs.writeFileSync(path.join(outputDir, 'env-config.js'), fileContent);

console.log('✅ Runtime environment configuration generated successfully!');
