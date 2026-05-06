import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Complaint AI Validator Service
 *
 * Uses Google Gemini AI to classify incoming complaints as either "real"
 * (legitimate grievance) or "fake" (spam, advertisement, joke, etc.)
 * before allowing them to be submitted to the platform.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export type AIValidationResult = "real" | "fake" | "error";

export interface ComplaintValidationPayload {
  title: string;
  text: string;
  category: string;
}

/**
 * Validates a complaint using Google Gemini AI SDK.
 */
export async function validateComplaintWithAI(
  payload: ComplaintValidationPayload
): Promise<AIValidationResult> {
  if (!GEMINI_API_KEY) {
    console.warn(
      "[AIValidator] GEMINI_API_KEY is not set. Skipping AI validation."
    );
    return "real";
  }

  try {
    console.log(`[AIValidator] Validating complaint: "${payload.title}"`);
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a content moderation AI for a whistleblowing platform. Your job is to determine if a complaint submission is genuine or fake (spam/advertisement/joke/test/low-effort).

A "real" complaint:
- Describes a specific, serious grievance, misconduct, corruption, fraud, or harassment.
- Contains substantial detail that indicates an actual event or situation.
- Is written with professional or serious intent.

A "fake" complaint:
- Is an advertisement or promotion (e.g., "Check out this...", "ad: ...").
- Contains low-effort filler text (e.g., "bla bla bla", "asdfghjkl", "test test").
- Is clearly a developer test or a joke.
- Is nonsensical, incoherent, or contains random characters.
- Lacks enough detail to be considered a legitimate report.

Analyze the following complaint carefully. Even if it sounds frustrated, if it lacks details and uses filler text like "bla bla", it is "fake".

Category: ${payload.category}
Title: ${payload.title}
Description: ${payload.text}

Respond with ONLY one word, lowercase: either "real" or "fake". Do not include any explanation or punctuation.`;

    console.log("[AIValidator] Calling Gemini SDK...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text().trim().toLowerCase();

    console.log(`[AIValidator] Gemini response: "${rawText}"`);

    if (rawText.includes("real")) return "real";
    if (rawText.includes("fake")) return "fake";

    console.warn(
      `[AIValidator] Unexpected Gemini response: "${rawText}". Defaulting to "real".`
    );
    return "real";
  } catch (err) {
    console.error("[AIValidator] SDK Error:", err);
    return "error";
  }
}
