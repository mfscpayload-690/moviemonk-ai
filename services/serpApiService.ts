/**
 * SerpApi Service
 * Uses Google Search API to find movies, shows, persons, and reviews.
 * Provides rich metadata including knowledge graphs and organic results.
 */

import { FetchResult } from '../types';

const SERPAPI_BASE_URL = 'https://serpapi.com/search.json';

export interface SerpApiResult {
    title: string;
    link: string;
    snippet: string;
    source?: string;
    thumbnail?: string;
    position?: number;
    type?: 'movie' | 'show' | 'person' | 'review';
    year?: string;
    rating?: string;
}

/**
 * Search Google via SerpApi
 */
export async function searchSerpApi(query: string, limit: number = 6): Promise<SerpApiResult[]> {
    const apiKey = process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY;

    if (!apiKey) {
        console.warn('⚠️ SERPAPI_KEY not configured');
        return [];
    }

    try {
        const url = new URL(SERPAPI_BASE_URL);
        url.searchParams.append('api_key', apiKey);
        url.searchParams.append('q', query);
        url.searchParams.append('engine', 'google');
        url.searchParams.append('num', '10'); // Fetch a few more to filter
        url.searchParams.append('hl', 'en');
        url.searchParams.append('gl', 'in'); // bias towards India as user mentioned regional cinema

        console.log(`🔍 SerpApi: Searching for "${query}"`);

        const response = await fetch(url.toString());

        if (!response.ok) {
            console.error(`❌ SerpApi request failed: ${response.status}`);
            return [];
        }

        const data = await response.json();
        const results: SerpApiResult[] = [];

        // 1. Check Knowledge Graph (High confidence)
        if (data.knowledge_graph) {
            const kg = data.knowledge_graph;
            results.push({
                title: kg.title,
                link: kg.website || kg.source?.link || '',
                snippet: kg.description || kg.type || '',
                thumbnail: kg.header_images?.[0]?.image || kg.image,
                type: detectTypeFromKG(kg.type),
                year: extractYear(kg.title + ' ' + (kg.description || '')),
                rating: kg.rating
            });
        }

        // 2. Process Organic Results
        if (data.organic_results && Array.isArray(data.organic_results)) {
            for (const result of data.organic_results) {
                if (results.length >= limit) break;

                // Skip if already found in KG (fuzzy match title)
                if (results.some(r => r.title.toLowerCase() === result.title.toLowerCase())) continue;

                results.push({
                    title: result.title,
                    link: result.link,
                    snippet: result.snippet || '',
                    thumbnail: result.thumbnail,
                    source: result.source,
                    type: detectTypeFromSnippet(result.title + ' ' + (result.snippet || '')),
                    year: extractYear(result.title + ' ' + (result.snippet || '')),
                    rating: result.rating
                });
            }
        }

        return results;

    } catch (error) {
        console.error('❌ SerpApi search error:', error);
        return [];
    }
}

function detectTypeFromKG(type: string = ''): 'movie' | 'show' | 'person' | 'review' {
    const t = type.toLowerCase();
    if (t.includes('film') || t.includes('movie')) return 'movie';
    if (t.includes('tv') || t.includes('series') || t.includes('show')) return 'show';
    if (t.includes('actor') || t.includes('actress') || t.includes('person') || t.includes('director')) return 'person';
    return 'movie'; // Default
}

function detectTypeFromSnippet(text: string): 'movie' | 'show' | 'person' | 'review' {
    const t = text.toLowerCase();
    if (t.includes('imdb') && t.includes('rating')) return 'review';
    if (t.includes('cast') || t.includes('poster')) return 'movie';
    return 'movie'; // Default
}

function extractYear(text: string): string | undefined {
    const match = text.match(/\b(19|20)\d{2}\b/);
    return match ? match[0] : undefined;
}
