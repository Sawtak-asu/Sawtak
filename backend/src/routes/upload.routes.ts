import { Elysia } from "elysia";
import { PublicEvidenceStorageService } from "../services/public-evidence-storage.service";
import { authMiddleware } from "../middleware/auth.middleware";

const storageService = new PublicEvidenceStorageService();

export const uploadRoutes = new Elysia({ prefix: "/api/upload" })
  .use(authMiddleware) // 🔒 Only authenticated users can upload files
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
  });
