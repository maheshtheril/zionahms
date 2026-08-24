'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/auth";

export interface DrugInteraction {
    drug1: string;
    drug2: string;
    riskLevel: 'mild' | 'moderate' | 'severe';
    description: string;
    recommendation: string;
}

export interface AllergyWarning {
    drug: string;
    allergy: string;
    description: string;
}

export interface InteractionCheckResult {
    hasWarnings: boolean;
    highestSeverity: 'none' | 'mild' | 'moderate' | 'severe';
    interactions: DrugInteraction[];
    allergyWarnings: AllergyWarning[];
}

export async function checkDrugInteractions(input: {
    newMedicines: string[];
    activeMedicines?: string[];
    allergies?: string[];
}): Promise<{ success: boolean; data?: InteractionCheckResult; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    const { newMedicines, activeMedicines = [], allergies = [] } = input;

    if (!newMedicines || newMedicines.length === 0) {
        return {
            success: true,
            data: {
                hasWarnings: false,
                highestSeverity: 'none',
                interactions: [],
                allergyWarnings: []
            }
        };
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
            You are a clinical pharmacology AI safety engine in a Hospital ERP.
            Evaluate the following new prescription drugs against existing active drugs and documented patient allergies for dangerous interactions or contraindications.

            NEW PRESCRIBED MEDICATIONS:
            ${JSON.stringify(newMedicines)}

            EXISTING ACTIVE MEDICATIONS:
            ${JSON.stringify(activeMedicines)}

            DOCUMENTED PATIENT ALLERGIES:
            ${JSON.stringify(allergies)}

            EVALUATE AND RETURN STRICT JSON MATCHING THIS SCHEMA:
            {
                "hasWarnings": boolean,
                "highestSeverity": "none" | "mild" | "moderate" | "severe",
                "interactions": [
                    {
                        "drug1": "string",
                        "drug2": "string",
                        "riskLevel": "mild" | "moderate" | "severe",
                        "description": "string explaining the mechanism of risk (e.g. increased bleeding risk, QT prolongation)",
                        "recommendation": "string recommending action (e.g. monitor INR, substitute with alternative)"
                    }
                ],
                "allergyWarnings": [
                    {
                        "drug": "string - prescribed drug",
                        "allergy": "string - allergen",
                        "description": "string explaining allergic risk (e.g. cross-sensitivity with Penicillin)"
                    }
                ]
            }

            CLINICAL RULES:
            - Evaluate drug-drug interactions between new drugs as well as between new and active drugs.
            - Check cross-sensitivities (e.g. Amoxicillin/Ampicillin for Penicillin allergy, Ibuprofen/Naproxen for NSAID/Aspirin allergy).
            - Output valid raw JSON only.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let cleaned = responseText;
        if (responseText.includes('```json')) {
            cleaned = responseText.split('```json')[1].split('```')[0].trim();
        } else if (responseText.includes('```')) {
            cleaned = responseText.split('```')[1].split('```')[0].trim();
        }

        const parsedData: InteractionCheckResult = JSON.parse(cleaned);

        return { success: true, data: parsedData };

    } catch (err: any) {
        console.error("[DrugInteractionChecker Error]", err);
        return { success: false, error: err.message || "Failed to check drug interactions." };
    }
}
