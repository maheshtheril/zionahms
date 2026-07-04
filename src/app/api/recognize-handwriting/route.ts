import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getDynamicAIModels } from "@/lib/ai-models"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "")

export async function POST(request: NextRequest) {
    try {
        // Check if API key exists
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            console.error('GOOGLE_GENERATIVE_AI_API_KEY is missing')
            return NextResponse.json({
                error: 'AI service not configured. Please add handwriting text manually.',
                details: 'Gemini API key not found in environment'
            }, { status: 503 })
        }

        const formData = await request.formData()
        const imageFile = formData.get('image') as File

        if (!imageFile) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 })
        }

        // Convert file to base64
        const buffer = Buffer.from(await imageFile.arrayBuffer())
        const base64Image = buffer.toString('base64')

        // Use Gemini Vision to extract text  
        const dynamicModels = await getDynamicAIModels(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
        // Use the absolute highest tier flash model available
        const model = genAI.getGenerativeModel({ model: dynamicModels[0] }, { apiVersion: 'v1beta' })

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: imageFile.type || 'image/png',
                    data: base64Image
                }
            },
            "You are an OCR system. Extract ALL handwritten text from this image. Return ONLY the extracted text with NO explanations, apologies, or conversational text. If no text is found, return empty string."
        ])

        const text = result.response.text()

        return NextResponse.json({
            success: true,
            text: text.trim()
        })

    } catch (error: any) {
        console.error('Handwriting recognition error:', error)
        let msg = error.message || 'Unknown error';
        let friendlyError = 'Failed to recognize handwriting';

        if (msg.includes("403") || msg.includes("denied access")) friendlyError = "API Key Permission Denied. Please ensure your Google AI API Key is valid and has billing enabled.";
        else if (msg.includes("429") && msg.includes("limit: 0")) friendlyError = "API Key Quota Exhausted. Your Google Cloud Free Tier limits have been reached.";
        else if (msg.includes("429") || msg.includes("Too Many Requests") || msg.includes("Quota exceeded")) friendlyError = "AI Rate Limit Reached. Please wait 1-2 minutes.";
        else if (msg.includes("503") || msg.includes("Overloaded")) friendlyError = "AI Server Overloaded. Google's servers are busy.";

        return NextResponse.json({
            error: friendlyError,
            details: msg
        }, { status: 500 })
    }
}

