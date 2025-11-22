/**
 * Secure Mistral API proxy - keeps API key server-side
 */
module.exports = async function handler(req: any, res: any) {
  const provider = 'mistral';
  const sendError = (status: number, code: string, message: string, details?: any) => {
    return res.status(status).json({ error: { provider, code, message, details } });
  };
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return sendError(405, 'method_not_allowed', 'Only POST supported');
  }

  const { messages, model, max_tokens, temperature, response_format } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return sendError(400, 'invalid_body', 'messages array required');
  }

  const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

  if (!MISTRAL_API_KEY) {
    return sendError(400, 'missing_api_key', 'Mistral API key not configured');
  }

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'mistral-small-latest',
        messages,
        max_tokens: max_tokens || 4000,
        temperature: temperature !== undefined ? temperature : 0.2,
        response_format: response_format || { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mistral API error:', response.status, errorText);
      return sendError(response.status, 'upstream_error', `Mistral API error ${response.status}`, errorText);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('Mistral proxy error:', error);
    return sendError(500, 'proxy_error', 'Mistral proxy request failed', error.message);
  }
}
