import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth.middleware";

export const uploadEvidenceRoutes = new Elysia({
  detail: {
    tags: ["File Upload"],
    description: "Pin evidence files to IPFS via Pinata",
  },
}).use(authMiddleware)
.post(
  "/upload-evidence",
  async ({ body, set }) => {
    try {
      const file = body.evidence;

      // 3. File Size Check (5MB)
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        set.status = 400;
        return {
          success: false,
          error: "File size exceeds the 5MB limit.",
        };
      }

      // 4. Pinata Integration
      const formData = new FormData();
      formData.append("file", file as Blob, file.name);

      const pinataJwt = process.env.PINATA_JWT;
      if (!pinataJwt) {
        throw new Error("Pinata JWT token is not configured.");
      }

      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pinataJwt}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Pinata upload failed: ${response.status} ${response.statusText} - ${errorData}`);
      }

      // 5. Response Handling
      const data = await response.json() as { IpfsHash: string };
      const ipfsHash = data.IpfsHash;

      return {
        success: true,
        message: "Evidence successfully pinned to IPFS.",
        ipfs_hash: ipfsHash,
        pinata_url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
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
      evidence: t.File({ description: "Evidence file to upload to IPFS (max 5MB)" }),
    }),
    detail: {
      summary: "Upload Evidence to IPFS",
      description: "Uploads an evidence file to IPFS using Pinata API and returns the IPFS hash and gateway URL.",
    },
  }
);
