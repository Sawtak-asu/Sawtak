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

    const prompt = `You are a content moderation AI for a citizen grievance and whistleblowing platform. Your job is to determine if a complaint submission is a "real" legitimate report or "fake" (spam, ads, or nonsense).

A "real" complaint:
- Describes any legitimate grievance, service issue (e.g., internet out, power cuts, road issues), or misconduct.
- Can be short or detailed, as long as it describes a possible real-world problem.
- Shows a genuine intent to report an issue to the authorities.

A "fake" complaint:
- Is an advertisement, promotion, or link-spam.
- Is complete gibberish, random characters, or nonsensical text (e.g., "asdfghjkl", "123456").
- Is an obvious system test (e.g., "test", "testing 123", "ignore this").
- Lacks any meaning or context (e.g., just "hello" or "ok").

Analyze the following complaint:

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
