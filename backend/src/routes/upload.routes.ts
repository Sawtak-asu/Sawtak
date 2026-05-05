import { Elysia, t } from "elysia";
import { PublicEvidenceStorageService } from "../services/public-evidence-storage.service";
import { authMiddleware } from "../middleware/auth.middleware";

const storageService = new PublicEvidenceStorageService();

export const uploadRoutes = new Elysia({ 
  prefix: "/api/upload",
  detail: {
    tags: ["File Upload"],
    description: "Secure file upload for complaint evidence"
  }
})
  .use(authMiddleware) 
  .post("/", async ({ body, set }: any) => {
    const rawFiles = body.files;

    if (!rawFiles) {
      set.status = 400;
      return { error: "No files provided" };
    }

    // Ensure we work with an array even if only one file is uploaded
    const files = Array.isArray(rawFiles) ? rawFiles : [rawFiles];

    try {
      // Handle multiple files concurrently
      const uploadPromises = files.map((file: any) => storageService.uploadFile(file));
      const urls = await Promise.all(uploadPromises);

      return {
        success: true,
        urls
      };
    } catch (err: any) {
      console.error("Upload error:", err);
      set.status = 500;
      return { error: err.message || "Upload failed" };
    }
  }, {
    body: t.Object({
      files: t.Any({ description: "One or more files to upload (multipart/form-data)" })
    }),
    detail: {
      summary: "Upload Evidence Files",
      description: `Upload one or more files as evidence for a complaint. Files are stored in Cloudflare R2 (encrypted).

**Supported formats:** Images (jpg, png, gif, webp), Videos (mp4, webm), Documents (pdf, doc, docx)

**Size limits:** Max 10MB per file, max 5 files per upload

**Security:** Files are encrypted at rest. Only accessible via generated URLs.`,
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                files: {
                  type: "array",
                  items: {
                    type: "string",
                    format: "binary"
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: "Files uploaded successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  urls: {
                    type: "array",
                    items: { type: "string" },
                    description: "Public URLs for uploaded files"
                  }
                }
              }
            }
          }
        },
        400: { description: "No files provided or invalid file type" },
        401: { description: "Authentication required" },
        413: { description: "File too large" },
        429: { description: "Upload rate limit exceeded (10 uploads per hour)" },
        500: { description: "Upload failed" }
      }
    }
  });
