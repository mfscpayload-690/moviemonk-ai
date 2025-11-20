import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Serverless proxy for OpenRouter API
 * This avoids CORS issues and keeps the API key secure on the backend
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for your frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, model, max_tokens, temperature } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request: messages array required' });
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OpenRouter API key not configured' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://moviemonk-sgtv3jh28-mfscpayload-690.vercel.app',
        'X-Title': 'MovieMonk AI'
      },
      body: JSON.stringify({
        model: model || 'meta-llama/llama-3.1-8b-instruct',
        messages,
        max_tokens: max_tokens || 4000,
        temperature: temperature || 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      
      return res.status(response.status).json({
        error: `OpenRouter API error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Proxy request failed',
      details: error.message
    });
  }
}
