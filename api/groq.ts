/**
 * Secure Groq API proxy - keeps API key server-side
 */
export {};
const { applyCors } = require('./_utils/cors');

let groqKeyIndex = 0;

function getGroqKeys(): string[] {
  const keys = [process.env.GROQ_API_KEY, process.env.VIBE_SEARCH_API_KEY]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim());

  return Array.from(new Set(keys));
}

function pickGroqKey(): string | null {
  const keys = getGroqKeys();
  if (keys.length === 0) return null;
  const selected = keys[groqKeyIndex % keys.length];
  groqKeyIndex = (groqKeyIndex + 1) % keys.length;
  return selected;
}

module.exports = async function handler(req: any, res: any) {
  const provider = 'groq';
  const sendError = (status: number, code: string, message: string, details?: any) => {
    return res.status(status).json({ error: { provider, code, message, details } });
  };
  const { originAllowed } = applyCors(req, res, 'POST, OPTIONS');

  if (req.headers.origin && !originAllowed) {
    return sendError(403, 'forbidden_origin', 'Origin is not allowed');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return sendError(405, 'method_not_allowed', 'Only POST supported');
  }

  const { messages, model, max_tokens, temperature, response_format } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return sendError(400, 'invalid_body', 'messages array required');
  }

  const GROQ_API_KEY = pickGroqKey();

  if (!GROQ_API_KEY) {
    return sendError(400, 'missing_api_key', 'Groq API key not configured');
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'llama-3.1-8b-instant',
        messages,
        max_tokens: max_tokens || 4000,
        temperature: temperature !== undefined ? temperature : 0.2,
        response_format: response_format || { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return sendError(response.status, 'upstream_error', `Groq API error ${response.status}`, errorText);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('Groq proxy error:', error);
    return sendError(500, 'proxy_error', 'Groq proxy request failed', error.message);
  }
}
