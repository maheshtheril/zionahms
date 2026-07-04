let cachedModels: string[] | null = null;
let lastFetchTime = 0;

/**
 * Dynamically fetches the latest available Gemini models from the Google API.
 * Caches the result in memory for 24 hours to prevent extra latency.
 * Filters out preview/lite/vision models and returns stable flash and pro models sorted by version.
 */
export async function getDynamicAIModels(apiKey: string): Promise<string[]> {
    if (cachedModels && Date.now() - lastFetchTime < 1000 * 60 * 60 * 24) {
        return cachedModels;
    }
    
    // Ultimate fallbacks in case API fails
    const fallbacks = ["gemini-2.5-flash", "gemini-pro-latest"];
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            console.warn(`[AI Models] Failed to fetch live models. Status: ${response.status}. Using fallbacks.`);
            return fallbacks;
        }
        
        const data = await response.json();
        if (!data || !data.models) return fallbacks;
        
        // Extract plain model names
        const allModels = data.models.map((m: any) => m.name.replace('models/', ''));
        
        // Filter and sort Flash models (e.g., gemini-3.5-flash > gemini-2.5-flash)
        const flashModels = allModels
            .filter((m: string) => m.includes('flash') && !m.includes('preview') && !m.includes('lite') && !m.includes('vision') && !m.includes('embedding') && !m.includes('tts') && !m.includes('image'))
            .sort((a: string, b: string) => b.localeCompare(a));
            
        // Filter and sort Pro models
        const proModels = allModels
            .filter((m: string) => m.includes('pro') && !m.includes('preview') && !m.includes('lite') && !m.includes('vision') && !m.includes('embedding') && !m.includes('tts') && !m.includes('image'))
            .sort((a: string, b: string) => b.localeCompare(a));
            
        // Combine them, prioritizing flash for speed/cost, then pro
        cachedModels = [...flashModels, ...proModels];
        
        if (cachedModels.length === 0) {
            cachedModels = fallbacks;
        } else {
            console.log(`[AI Models] Dynamically resolved and cached latest models: ${cachedModels.slice(0, 3).join(', ')}...`);
        }
        
        lastFetchTime = Date.now();
        return cachedModels;
    } catch (error) {
        console.error("[AI Models] Error fetching live models:", error);
        return fallbacks;
    }
}
