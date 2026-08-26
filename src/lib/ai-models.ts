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
    
// Stable, production-ready models with active quotas for all API keys
const STABLE_MODELS = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-pro"
];

/**
 * Resolves available Gemini models, strictly prioritizing stable, high-quota models.
 * Filters out internal/restricted preview models (like 3.x) that trigger 403 / 429 quota errors.
 */
export async function getDynamicAIModels(apiKey: string): Promise<string[]> {
    if (cachedModels && Date.now() - lastFetchTime < 1000 * 60 * 60 * 24) {
        return cachedModels;
    }
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            console.warn(`[AI Models] Live models endpoint returned ${response.status}. Using stable defaults.`);
            return STABLE_MODELS;
        }
        
        const data = await response.json();
        if (!data || !Array.isArray(data.models)) return STABLE_MODELS;
        
        // Extract plain model names
        const allModels: string[] = data.models.map((m: any) => m.name.replace('models/', ''));
        
        // Find supported stable models that exist in the account's model list
        const availableStable = STABLE_MODELS.filter(m => allModels.includes(m));
        
        // Add other valid 2.0/1.5 flash models
        const additionalFlash = allModels.filter(m => 
            (m.startsWith('gemini-2.0') || m.startsWith('gemini-1.5')) &&
            m.includes('flash') &&
            !STABLE_MODELS.includes(m) &&
            !m.includes('preview') &&
            !m.includes('embedding') &&
            !m.includes('tts')
        );

        cachedModels = Array.from(new Set([...availableStable, ...additionalFlash, ...STABLE_MODELS]));
        
        console.log(`[AI Models] Successfully prioritized models: ${cachedModels.slice(0, 3).join(', ')}`);
        lastFetchTime = Date.now();
        return cachedModels;
    } catch (error) {
        console.error("[AI Models] Error fetching live models:", error);
        return STABLE_MODELS;
    }
}
