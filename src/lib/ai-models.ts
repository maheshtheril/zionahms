let cachedModels: string[] | null = null;
let lastFetchTime = 0;

// Priority ordered models: newest first, followed by guaranteed high-quota fallbacks
const RECOMMENDED_MODELS = [
    "gemini-3.7-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-pro"
];

/**
 * Resolves available Gemini models in priority order.
 * Ensures newer models (like 3.7-flash) are tried first, followed by 2.0-flash and 1.5-flash.
 */
export async function getDynamicAIModels(apiKey: string): Promise<string[]> {
    if (cachedModels && Date.now() - lastFetchTime < 1000 * 60 * 60 * 24) {
        return cachedModels;
    }
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            console.warn(`[AI Models] Live models endpoint returned ${response.status}. Using recommended defaults.`);
            return RECOMMENDED_MODELS;
        }
        
        const data = await response.json();
        if (!data || !Array.isArray(data.models)) return RECOMMENDED_MODELS;
        
        // Extract plain model names for models supporting generateContent
        const validModels = data.models.filter((m: any) => 
            Array.isArray(m.supportedGenerationMethods) && 
            m.supportedGenerationMethods.includes('generateContent')
        );
        const allModels: string[] = validModels.map((m: any) => m.name.replace('models/', ''));
        
        // Filter and order based on RECOMMENDED_MODELS
        const prioritized = RECOMMENDED_MODELS.filter(m => allModels.includes(m));
        
        // Add any other flash/pro models returned by Google (excluding audio, tts, embedding, realtime)
        const others = allModels.filter(m => 
            (m.includes('flash') || m.includes('pro')) &&
            !RECOMMENDED_MODELS.includes(m) &&
            !m.includes('preview') &&
            !m.includes('embedding') &&
            !m.includes('audio') &&
            !m.includes('tts') &&
            !m.includes('realtime')
        );

        cachedModels = Array.from(new Set([...prioritized, ...others, ...RECOMMENDED_MODELS]));
        
        console.log(`[AI Models] Model pipeline ready: ${cachedModels.slice(0, 5).join(', ')}`);
        lastFetchTime = Date.now();
        return cachedModels;
    } catch (error) {
        console.error("[AI Models] Error fetching live models:", error);
        return RECOMMENDED_MODELS;
    }
}

/**
 * Translates low-level technical AI errors / SDK exceptions into clean, enterprise-grade,
 * customer-friendly messages without exposing internal URLs, stack traces, or technical jargon.
 */
export function formatFriendlyAiError(error: any, fallbackSubject = "invoice"): string {
    if (!error) return `Unable to process ${fallbackSubject}. Please try again or enter details manually.`;
    
    const msg = typeof error === 'string' ? error : (error.message || String(error));

    // Quota exhausted (Free tier limit: 0 or quota exceeded)
    if (msg.includes("limit: 0") || msg.includes("limit:0") || msg.includes("RESOURCE_EXHAUSTED") || (msg.includes("429") && msg.includes("Quota"))) {
        return "AI scanning quota reached for this account. Please check your Gemini API plan in Settings > AI Configuration or try again later.";
    }

    // Rate limit (Too Many Requests - temporary)
    if (msg.includes("429") || msg.includes("Too Many Requests") || msg.includes("rate limit")) {
        return "AI service is currently busy handling requests. Please wait a few moments and try again.";
    }

    // Permission denied / Invalid Key
    if (msg.includes("403") || msg.includes("denied access") || msg.includes("PERMISSION_DENIED") || msg.includes("API_KEY_INVALID") || msg.includes("API key not valid")) {
        return "AI authentication failed. Please verify your Gemini API key in Settings > AI Configuration.";
    }

    // Server unavailable / Overloaded
    if (msg.includes("503") || msg.includes("500") || msg.includes("Overloaded") || msg.includes("UNAVAILABLE") || msg.includes("Internal Server Error")) {
        return "AI processing service is temporarily unavailable. Please try again in 1-2 minutes.";
    }

    // Content extraction / clarity issues
    if (msg.includes("0 items") || msg.includes("invalid JSON") || msg.includes("JSON Parse Failed")) {
        return `Unable to clearly read details from this ${fallbackSubject}. Please ensure the image is bright, focused, and upright, then try again.`;
    }

    // If all models failed or 404
    if (msg.includes("404") || msg.includes("not found") || msg.includes("All configured AI models failed") || msg.includes("GoogleGenerativeAI")) {
        return `Unable to process ${fallbackSubject} with the current AI configuration. Please verify your API key in Settings or try again.`;
    }

    // If message is already clean/friendly (no technical tokens)
    if (!msg.includes("http") && !msg.includes("GoogleGenerativeAI") && !msg.includes("v1beta") && !msg.includes("{") && !msg.includes("[")) {
        return msg;
    }

    return `Unable to process ${fallbackSubject} at this time. Please try again or enter details manually.`;
}

