
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
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedText) as MovieData;
    } catch (error) {
        console.error("Failed to parse JSON response:", error);
        console.error("Raw text:", text);
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

        // Enrich missing images via TMDB if needed
        try {
            if (!movieData.poster_url || !movieData.backdrop_url || !movieData.extra_images || movieData.extra_images.length === 0) {
                movieData = await enrichWithTMDB(movieData);
            }
        } catch (e) {
            console.warn('Image enrichment skipped due to error:', e);
        }

        const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingSource[]) || null;

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
