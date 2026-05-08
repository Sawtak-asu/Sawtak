import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth.middleware";

export const uploadEvidenceRoutes = new Elysia({
  prefix: "/api/upload",
  detail: {
    tags: ["File Upload"],
    description: "Pin evidence files to IPFS via Pinata",
  },
}).use(authMiddleware)
.post(
  "/ipfs",
  async ({ body, set }) => {
    try {
      const rawFiles = body.files;

      if (!rawFiles) {
        set.status = 400;
        return { success: false, error: "No files provided." };
      }

      // Ensure it's an array
      const files = Array.isArray(rawFiles) ? rawFiles : [rawFiles];

      // 3. File Size Check (50MB per file)
      const MAX_FILE_SIZE = 50 * 1024 * 1024;
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          set.status = 400;
          return {
            success: false,
            error: `File ${file.name} exceeds the 50MB limit.`,
          };
        }
      }

      const pinataJwt = process.env.PINATA_JWT;
      if (!pinataJwt) {
        throw new Error("Pinata JWT token is not configured.");
      }

      // 4. Pinata Integration for multiple files concurrently
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file as Blob, file.name);

        const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${pinataJwt}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Pinata upload failed for ${file.name}: ${response.status} ${response.statusText} - ${errorData}`);
        }

        const data = await response.json() as { IpfsHash: string };
        return data.IpfsHash;
      });

      const ipfsHashes = await Promise.all(uploadPromises);
      const urls = ipfsHashes.map(hash => `https://gateway.pinata.cloud/ipfs/${hash}`);

      // 5. Response Handling
      return {
        success: true,
        message: "Evidence successfully pinned to IPFS.",
        ipfs_hashes: ipfsHashes,
        urls: urls,
      };
    } catch (error: any) {
      // 6. Error Handling
      console.error("Error uploading to Pinata:", error);
      set.status = 500;
      return {
        success: false,
        error: "An internal server error occurred during the file upload.",
      };
    }
  },
  {
    body: t.Object({
      files: t.Any({ description: "One or more evidence files to upload to IPFS (max 5MB each)" }),
    }),
    detail: {
      summary: "Upload Evidence to IPFS",
      description: "Uploads evidence files to IPFS using Pinata API and returns the IPFS hashes and gateway URLs.",
    },
  }
);
