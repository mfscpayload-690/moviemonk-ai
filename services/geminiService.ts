
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, MovieData, QueryComplexity, FetchResult, GroundingSource } from '../types';
import { INITIAL_PROMPT } from '../constants';
import { enrichWithTMDB } from './tmdbService';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const parseJsonResponse = (text: string): MovieData | null => {
    try {
        // Strategy 1: Clean and parse directly
        let cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedText) as MovieData;
    } catch (error) {
        console.warn("Direct parse failed, trying extraction...");
        
        try {
            // Strategy 2: Extract JSON from surrounding text using regex
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const extracted = jsonMatch[0];
                return JSON.parse(extracted) as MovieData;
            }
        } catch (e) {
            console.warn("Regex extraction failed");
        }
        
        try {
            // Strategy 3: Find first { and last }, extract between them
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                const extracted = text.substring(firstBrace, lastBrace + 1);
                return JSON.parse(extracted) as MovieData;
            }
        } catch (e) {
            console.warn("Brace extraction failed");
        }
        
        console.error("All parsing strategies failed. Raw text:", text);
        return null;
    }
};

export async function fetchMovieData(query: string, complexity: QueryComplexity, chatHistory?: ChatMessage[]): Promise<FetchResult> {
    let modelName: string;
    let thinkingBudget: number | undefined;

    switch (complexity) {
        case QueryComplexity.COMPLEX:
            modelName = 'gemini-2.5-pro';
            thinkingBudget = 32768; // Max thinking budget for complex queries
            break;
        case QueryComplexity.SIMPLE:
        default:
            modelName = 'gemini-2.5-flash';
            break;
    }

    let fullPrompt = `User query: "${query}"`;
    if (chatHistory && chatHistory.length > 0) {
        const historyText = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n');
        fullPrompt = `Continue this conversation:\n${historyText}\n\nNew user query: "${query}"`;
    }

    try {
        // Start TMDB enrichment promise early (parallel processing)
        let tmdbEnrichmentPromise: Promise<MovieData | null> | null = null;
        
        const response = await ai.models.generateContent({
            model: modelName,
            contents: fullPrompt,
            config: {
                systemInstruction: INITIAL_PROMPT,
                tools: [{ googleSearch: {} }],
                ...(thinkingBudget && { thinkingConfig: { thinkingBudget } })
            },
        });

        const jsonText = response.text;
        
        if (!jsonText) {
            const finishReason = response.candidates?.[0]?.finishReason;
            let errorMessage = "The AI returned an empty response. This might be due to a content filter or an internal issue.";
            if (finishReason === 'SAFETY') {
                errorMessage = "The response was blocked for safety reasons. Please try a different or less sensitive query.";
            } else if (finishReason === 'MAX_TOKENS') {
                errorMessage = "The response was too long and got cut off. Please try a more specific query.";
            }
            console.error("Gemini response was empty. Finish reason:", finishReason);
            return { movieData: null, sources: null, error: errorMessage };
        }
        
        let movieData = parseJsonResponse(jsonText);
        if (!movieData) {
            return { movieData: null, sources: null, error: "Failed to parse the AI's response. The data might be in an unexpected format." };
        }

        // Check if TMDB enrichment is needed and start it ASAP
        const needsEnrichment = !movieData.poster_url || !movieData.backdrop_url || !movieData.extra_images || movieData.extra_images.length === 0;
        
        if (needsEnrichment) {
            // Start enrichment immediately (don't await yet)
            tmdbEnrichmentPromise = enrichWithTMDB(movieData);
        }

        // Get sources while TMDB enrichment runs
        const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingSource[]) || null;

        // Now await TMDB enrichment if it was started
        if (tmdbEnrichmentPromise) {
            try {
                const enriched = await tmdbEnrichmentPromise;
                if (enriched) {
                    movieData = enriched;
                }
            } catch (e) {
                console.warn('Image enrichment skipped due to error:', e);
            }
        }

        return { movieData, sources };
    } catch (error) {
        console.error(`Error fetching data from Gemini with model ${modelName}:`, error);
        let errorMessage = "An unknown error occurred while communicating with the AI.";
        if (error instanceof Error) {
            // Check for specific error messages to provide better user feedback
            if (error.message.includes('API key not valid')) {
                errorMessage = "The AI service API key is invalid. Please check the configuration.";
            } else if (error.message.toLowerCase().includes('quota') || error.message.includes('429')) {
                errorMessage = "The request rate limit has been exceeded. Please try again in a few moments.";
            } else if (error.message.includes('500') || error.message.includes('503')) {
                errorMessage = "The AI service is currently unavailable or experiencing issues. Please try again later.";
            } else {
                // For other errors, show a generic message with the error details
                errorMessage = `An unexpected error occurred: ${error.message}`;
            }
        }
        return { movieData: null, sources: null, error: errorMessage };
    }
}
