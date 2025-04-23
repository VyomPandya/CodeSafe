// Minimal Express backend proxy for OpenRouter
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.post('/api/openrouter', async (req, res) => {
  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OpenRouter API key not configured on server.' });
  }
  try {
    const { code, ...options } = req.body;
    const response = await fetch('https://codesafe-openrouter-proxy-vyom-pandyas-projects.vercel.app/openrouter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': req.headers.origin || '',
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
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`OpenRouter proxy server running on port ${PORT}`);
});
