/**
 * Complaint AI Validator Service
 *
 * Uses Google Gemini AI to classify incoming complaints as either "real"
 * (legitimate grievance) or "fake" (spam, advertisement, joke, etc.)
 * before allowing them to be submitted to the platform.
 *
 * Responds with a single lowercase word: "real" or "fake"
 */

/** Shape of a successful Gemini generateContent response */
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export type AIValidationResult = "real" | "fake" | "error";

export interface ComplaintValidationPayload {
  title: string;
  text: string;
  category: string;
}

/**
 * Validates a complaint using Google Gemini AI.
 *
 * Returns:
 *   - "real"  → complaint looks genuine, allow submission
 *   - "fake"  → complaint looks like spam/ad/joke, block submission
 *   - "error" → Gemini call failed; in this case we allow submission
 *               to avoid blocking legitimate users due to API downtime
 */
export async function validateComplaintWithAI(
  payload: ComplaintValidationPayload
): Promise<AIValidationResult> {
  if (!GEMINI_API_KEY) {
    console.warn(
      "[AIValidator] GEMINI_API_KEY is not set. Skipping AI validation."
    );
    return "real"; // Fail open — don't block submissions if key is missing
  }

  const prompt = `You are a content moderation AI for a whistleblowing platform. Your job is to determine if a complaint submission is genuine or fake (spam/advertisement/joke/test).

A "real" complaint:
- Describes an actual grievance, misconduct, corruption, fraud, harassment, or similar serious issue
- Has coherent, meaningful content related to the complaint category
- Is written in a way that indicates a genuine concern

A "fake" complaint:
- Is spam or an advertisement
- Is clearly a test or random gibberish
- Is a joke or nonsensical content
- Is unrelated to any real complaint

Analyze the following complaint:

Category: ${payload.category}
Title: ${payload.title}
Description: ${payload.text}

Respond with ONLY one word, lowercase: either "real" or "fake". Do not include any explanation or punctuation.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent classification
          maxOutputTokens: 5, // We only need one word
          topP: 0.8,
          topK: 10,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[AIValidator] Gemini API error ${response.status}: ${errorText}`
      );
      return "error";
    }

    const data = await response.json() as GeminiResponse;
    const rawText: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.toLowerCase() ?? "";

    console.log(`[AIValidator] Gemini response: "${rawText}"`);

    if (rawText === "real" || rawText === "fake") {
      return rawText;
    }

    // If response contains "real" or "fake" as substring, extract it
    if (rawText.includes("real")) return "real";
    if (rawText.includes("fake")) return "fake";

    console.warn(
      `[AIValidator] Unexpected Gemini response: "${rawText}". Defaulting to "real".`
    );
    return "real"; // Fail open on unexpected responses
  } catch (err) {
    console.error("[AIValidator] Failed to call Gemini API:", err);
    return "error";
  }
}
