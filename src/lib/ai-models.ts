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
        
        // Extract plain model names
        const allModels: string[] = data.models.map((m: any) => m.name.replace('models/', ''));
        
        // Filter and order based on RECOMMENDED_MODELS
        const prioritized = RECOMMENDED_MODELS.filter(m => allModels.includes(m));
        
        // Add any other flash/pro models returned by Google
        const others = allModels.filter(m => 
            (m.includes('flash') || m.includes('pro')) &&
            !RECOMMENDED_MODELS.includes(m) &&
            !m.includes('preview') &&
            !m.includes('embedding') &&
            !m.includes('tts')
        );

        cachedModels = Array.from(new Set([...prioritized, ...RECOMMENDED_MODELS, ...others]));
        
        console.log(`[AI Models] Model pipeline ready: ${cachedModels.slice(0, 4).join(', ')}`);
        lastFetchTime = Date.now();
        return cachedModels;
    } catch (error) {
        console.error("[AI Models] Error fetching live models:", error);
        return RECOMMENDED_MODELS;
    }
}
