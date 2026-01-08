import { Elysia, t } from "elysia";
import { AnonymousComplaintController } from "../controllers/anonymous-complaint.controller";
import { authMiddleware } from "../middleware/auth.middleware";

// Initialize controller
const controller = new AnonymousComplaintController();

export const anonymousComplaintRoutes = new Elysia({ 
  prefix: "/api/complaints/anonymous",
  detail: {
    tags: ["Anonymous Complaints"],
    description: "Submit anonymous complaints to the blockchain with full privacy protection"
  }
})
  .use(authMiddleware)
  /**
   * POST /api/complaints/anonymous/submit
   * Submit an anonymous complaint to the blockchain
   */
  .post("/submit", async ({ body, set }: any) => {
    return controller.submitComplaint(body, set);
  }, {
    body: t.Object({
      anonymousIdentifier: t.String({ 
        description: "Client-generated anonymous identifier (hashed)" 
      }),
      title: t.String({ 
        description: "Brief title of the complaint",
        minLength: 5,
        maxLength: 200
      }),
      text: t.String({ 
        description: "Detailed description of the complaint",
        minLength: 20,
        maxLength: 10000
      }),
      category: t.String({ 
        description: "Complaint category (corruption, harassment, fraud, etc.)" 
      }),
      area: t.Optional(t.String({ 
        description: "Geographic area where the incident occurred" 
      })),
      directedTo: t.Optional(t.Object({
        type: t.String({ description: "Target type: ministry, governorate, or center" }),
        ministryId: t.Optional(t.String()),
        governorateId: t.Optional(t.String()),
        centerId: t.Optional(t.String())
      }, { description: "Optional: Direct complaint to specific authority" })),
      incidentDate: t.Optional(t.String({ 
        description: "Date of incident (ISO 8601 format)" 
      })),
      evidenceCids: t.Optional(t.Array(t.String(), { 
        description: "Array of IPFS CIDs for uploaded evidence" 
      }))
    }),
    detail: {
      summary: "Submit Anonymous Complaint",
      description: `Submit an anonymous complaint that gets recorded on the Hedera blockchain. 
      
**Privacy Guarantees:**
- No IP logging
- No browser fingerprinting  
- Encrypted anonymous identifier
- Immutable blockchain record

**Returns:** A tracking code that can be used to check complaint status without revealing identity.`,
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Complaint successfully submitted to blockchain",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  data: {
                    type: "object",
                    properties: {
                      transactionId: { type: "string", description: "HCS transaction ID" },
                      trackingCode: { type: "string", description: "SAWTAK-XXXXXXXX format tracking code" },
                      consensusTimestamp: { type: "string", description: "Blockchain consensus timestamp" },
                      topicId: { type: "string", description: "HCS topic ID for verification" }
                    }
                  },
                  message: { type: "string" }
                }
              }
            }
          }
        },
        400: { description: "Invalid request body" },
        401: { description: "Authentication required" },
        429: { description: "Rate limit exceeded (5 anonymous complaints per hour)" },
        500: { description: "Blockchain submission failed" }
      }
    }
  });
