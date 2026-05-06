import { Elysia, t } from "elysia";
import {
  validateComplaintWithAI,
  type ComplaintValidationPayload,
} from "../services/complaint-ai-validator.service";
import { authMiddleware } from "../middleware/auth.middleware";

/**
 * Route: POST /api/complaints/validate
 *
 * Pre-submission AI validation endpoint.
 * The frontend calls this BEFORE the actual submit to get a real/fake verdict
 * from Gemini. If fake, the submission is blocked client-side with a warning.
 *
 * This is a lightweight endpoint — it does NOT save anything to DB or blockchain.
 */
export const complaintValidationRoutes = new Elysia({
  prefix: "/api/complaints",
  detail: {
    tags: ["Complaint Validation"],
    description: "AI-powered complaint validation using Gemini",
  },
})
  .use(authMiddleware)
  .post(
    "/validate",
    async ({ body, set }: any) => {
      try {
        const { title, text, category } = body as ComplaintValidationPayload;

        if (!title || !text || !category) {
          set.status = 400;
          return {
            success: false,
            error: "title, text, and category are required for validation",
          };
        }

        console.log(
          `[ComplaintValidation] Running AI validation for complaint: "${title.substring(0, 50)}..."`
        );

        const verdict = await validateComplaintWithAI({ title, text, category });

        console.log(`[ComplaintValidation] Verdict: ${verdict}`);

        return {
          success: true,
          verdict, // "real" | "fake" | "error"
          message:
            verdict === "real"
              ? "Complaint passed AI validation"
              : verdict === "fake"
              ? "Complaint appears to be spam or fake"
              : "AI validation inconclusive — proceeding with submission",
        };
      } catch (error: any) {
        console.error("[ComplaintValidation] Validation error:", error);
        // Fail open — return "error" so the frontend can still allow submission
        return {
          success: true,
          verdict: "error",
          message: "AI validation service unavailable — submission allowed",
        };
      }
    },
    {
      body: t.Object({
        title: t.String({
          description: "Complaint title",
          minLength: 1,
        }),
        text: t.String({
          description: "Complaint body text",
          minLength: 1,
        }),
        category: t.String({
          description: "Complaint category",
        }),
      }),
      detail: {
        summary: "Validate Complaint with AI",
        description: `Run AI pre-submission validation on complaint content using Google Gemini.

**Returns:**
- \`verdict: "real"\` → Complaint is genuine, allow submission  
- \`verdict: "fake"\` → Complaint appears to be spam/ad/joke, block submission  
- \`verdict: "error"\` → AI unavailable, allow submission (fail-open)

This endpoint does NOT submit the complaint — it only validates content.`,
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Validation result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    verdict: {
                      type: "string",
                      enum: ["real", "fake", "error"],
                    },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          400: { description: "Missing required fields" },
          401: { description: "Authentication required" },
        },
      },
    }
  );
