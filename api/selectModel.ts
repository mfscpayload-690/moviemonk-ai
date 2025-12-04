import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkProviderAvailability } from '../services/aiService';

type AIProvider = 'groq' | 'mistral' | 'openrouter' | 'perplexity';

interface ModelSelectionResponse {
  ok: boolean;
  selectedModel: AIProvider;
  reason: string;
  alternatives: AIProvider[];
  queryType: string;
}

// Determine query type from search result
function detectQueryType(
  title: string,
  type: 'movie' | 'person' | 'review'
): 'movie' | 'person' | 'review' | 'complex' {
  if (type === 'review') return 'review';
  if (type === 'person') return 'person';

  // Detect complex movie queries
  const complexKeywords = [
    'production',
    'budget',
    'box office',
    'awards',
    'analysis',
    'breakdown',
    'comparison'
  ];

  if (complexKeywords.some(kw => title.toLowerCase().includes(kw))) {
    return 'complex';
  }

  return 'movie';
}

// Model recommendations based on query type and availability
const modelMatrix: Record<string, AIProvider[]> = {
  // Movie queries: Fast, accurate plot summaries
  movie: ['groq', 'mistral', 'openrouter', 'perplexity'],

  // Person/Actor queries: Detailed biographical info
  person: ['mistral', 'groq', 'openrouter', 'perplexity'],

  // Review queries: Web-aware, nuanced opinions
  review: ['perplexity', 'openrouter', 'mistral', 'groq'],

  // Complex queries: Fallback to most capable model
  complex: ['openrouter', 'perplexity', 'mistral', 'groq']
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      selectedModel: 'groq',
      reason: 'Method not allowed',
      alternatives: [],
      queryType: 'unknown'
    });
  }

  try {
    const resultType = (req.query.type as 'movie' | 'person' | 'review') || 'movie';
    const resultTitle = (req.query.title as string) || '';

    // Detect query type
    const queryType = detectQueryType(resultTitle, resultType);

    // Get model preferences for this query type
    const preferences = modelMatrix[queryType] || modelMatrix['movie'];

    // Check availability of each model
    const availableModels: AIProvider[] = [];
    const unavailableModels: AIProvider[] = [];

    for (const model of preferences) {
      const availability = checkProviderAvailability(model);
      if (availability === 'available') {
        availableModels.push(model);
      } else {
        unavailableModels.push(model);
      }
    }

    // Select best available model
    const selectedModel = availableModels[0] || preferences[0];

    const reasons: Record<string, string> = {
      movie: '🎬 Movie query - using Groq for fast, accurate summaries',
      person:
        '👤 Person query - using Mistral for detailed biographical information',
      review:
        '⭐ Review query - using Perplexity for web-aware opinions and analysis',
      complex:
        '🧠 Complex query - using OpenRouter for comprehensive analysis'
    };

    return res.status(200).json({
      ok: true,
      selectedModel,
      reason: reasons[queryType],
      alternatives: availableModels.slice(1),
      queryType
    });
  } catch (error: any) {
    console.error('Model selection error:', error);
    return res.status(500).json({
      ok: false,
      selectedModel: 'groq',
      reason: 'Error selecting model, defaulting to Groq',
      alternatives: ['mistral', 'openrouter', 'perplexity'],
      queryType: 'unknown'
    });
  }
}
