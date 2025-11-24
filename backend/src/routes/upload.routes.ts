import { Elysia } from "elysia";
import { PublicEvidenceStorageService } from "../services/public-evidence-storage.service";
import { authMiddleware } from "../middleware/auth.middleware";

const storageService = new PublicEvidenceStorageService();

export const uploadRoutes = new Elysia({ prefix: "/api/upload" })
  .use(authMiddleware) // 🔒 Only authenticated users can upload files
  .post("/", async ({ body, set }: any) => {
    const files = body.files;

    if (!files || files.length === 0) {
      set.status = 400;
      return { error: "No files provided" };
    }

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
