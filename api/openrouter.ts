/**
 * Serverless proxy for OpenRouter API
 * This avoids CORS issues and keeps the API key secure on the backend
 */
module.exports = async function handler(req: any, res: any) {
  const provider = 'openrouter';
  const sendError = (status: number, code: string, message: string, details?: any) => {
    return res.status(status).json({ error: { provider, code, message, details } });
  };
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
    return sendError(405, 'method_not_allowed', 'Only POST supported');
  }

  const { messages, model, max_tokens, temperature } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return sendError(400, 'invalid_body', 'messages array required');
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    return sendError(400, 'missing_api_key', 'OpenRouter API key not configured');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://moviemonk-ai.vercel.app',
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
      return sendError(response.status, 'upstream_error', `OpenRouter API error ${response.status}`, errorText);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('Proxy error:', error);
    return sendError(500, 'proxy_error', 'Proxy request failed', error.message);
  }
}
