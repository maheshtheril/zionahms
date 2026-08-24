'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface ParsedClinicalNote {
    complaints: string[];
    diagnosis: string;
    vitalsAdvice?: string;
    medicines: Array<{
        name: string;
        dosage?: string;      // e.g. "500mg"
        frequency?: string;   // e.g. "1-0-1" or "TDS"
        duration?: string;    // e.g. "5 days"
        instructions?: string; // e.g. "After food"
    }>;
    labTests?: string[];
    followUpDays?: number;
    doctorNotes?: string;
}

export async function parseSpokenClinicalNote(transcript: string): Promise<{ success: boolean; data?: ParsedClinicalNote; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    if (!transcript || transcript.trim().length < 5) {
        return { success: false, error: "Transcript is too short to analyze." };
    }

    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
        if (!apiKey) {
            return { success: false, error: "Gemini AI API key is not configured." };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json"
            }
        });

        const prompt = `
            You are an expert AI Medical Dictation Assistant in a Hospital Management System.
            Analyze the following spoken doctor dictation transcript and extract structured clinical information into strict JSON.

            TRANSCRIPT:
            "${transcript}"

            EXTRACT INTO STRICT JSON matching this JSON schema:
            {
                "complaints": ["string - list of patient symptoms or chief complaints"],
                "diagnosis": "string - clinical diagnosis or impression",
                "vitalsAdvice": "string - any advice regarding vitals or rest",
                "medicines": [
                    {
                        "name": "string - medicine or drug name",
                        "dosage": "string - e.g. 500mg, 10ml",
                        "frequency": "string - e.g. 1-0-1, 1-1-1, Once daily, Twice daily, TDS",
                        "duration": "string - e.g. 5 days, 1 week",
                        "instructions": "string - e.g. After food, Before food, At bedtime"
                    }
                ],
                "labTests": ["string - any ordered lab tests, e.g. CBC, Lipid Profile"],
                "followUpDays": number or null,
                "doctorNotes": "string - any general advice to patient"
            }

            STRICT INSTRUCTIONS:
            - MULTI-LANGUAGE TRANSLATION: If the spoken transcript is in Malayalam, Hindi, Tamil, Telugu, Arabic, Spanish, French, or any other language, translate all symptoms, diagnoses, and advice into clean, professional English medical terminology.
            - Keep drug names accurate (e.g., Paracetamol, Amoxicillin).
            - Standardize medicine frequencies (e.g. "three times a day" -> "TDS", "twice daily" -> "1-0-1").
            - Do not invent information not implied in the transcript.
            - Ensure output is valid raw JSON only.

        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let cleaned = responseText;
        if (responseText.includes('```json')) {
            cleaned = responseText.split('```json')[1].split('```')[0].trim();
        } else if (responseText.includes('```')) {
            cleaned = responseText.split('```')[1].split('```')[0].trim();
        }

        const parsedData: ParsedClinicalNote = JSON.parse(cleaned);

        return { success: true, data: parsedData };

    } catch (err: any) {
        console.error("[VoiceClinicalParser Error]", err);
        return { success: false, error: err.message || "Failed to parse spoken clinical dictation." };
    }
}
