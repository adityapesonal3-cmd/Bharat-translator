import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string,
  options: { tone?: string; context?: string } = {}
) {
  const prompt = `
    You are an expert translator specializing in Indian languages.
    Translate the following text from ${sourceLang} to ${targetLang}.
    
    Text: "${text}"
    ${options.tone ? `Tone: ${options.tone}` : ""}
    ${options.context ? `Context: ${options.context}` : ""}

    Requirements:
    1. Provide a natural, context-aware translation.
    2. If the target is English, ensure correct grammar.
    3. If the target is an Indian language, use appropriate regional nuances.
    4. Return ONLY a JSON object with the following fields:
       {
         "translatedText": "the translated version",
         "confidenceScore": 0.0-1.0,
         "detectedLanguage": "iso code",
         "grammarSuggestions": ["if any"],
         "culturalNotes": "any relevant regional context"
       }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    const textResult = response.text || "";
    // Clean JSON if needed
    const cleanedJson = textResult.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

export async function translateImage(
  base64Image: string,
  targetLang: string
) {
  const prompt = `
    Analyze this image. It may contain documents, signs, menus, or posters.
    1. Extract all text (OCR).
    2. Translate the extracted text into ${targetLang}.
    3. Return ONLY a JSON object:
       {
         "originalText": "the extracted text",
         "translatedText": "the translated version",
         "detectedElements": ["e.g. sign, menu"],
         "confidenceScore": 0.0-1.0
       }
  `;

  try {
    const parts = [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image.split(",")[1] || base64Image,
        },
      },
      { text: prompt },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts }
    });

    const textResult = response.text || "";
    const cleanedJson = textResult.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error("Image translation error:", error);
    throw error;
  }
}

export async function chatAssistant(message: string, history: any[]) {
  const prompt = `
    You are Bharat Translate AI Assistant. Your goal is to help users communicate across Indian languages.
    Answer the following request: "${message}"
    Keep it brief, helpful, and culturally relevant.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });
  
  return response.text;
}
