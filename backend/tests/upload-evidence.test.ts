import { describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import { uploadEvidenceRoutes } from "../src/routes/upload-evidence.routes";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const app = new Elysia().use(uploadEvidenceRoutes);

describe("Upload Evidence Route Test", () => {
  test("Should fail if file is larger than 5MB", async () => {
    // Create a dummy file of 6MB
    const largeBuffer = new Uint8Array(6 * 1024 * 1024);
    const blob = new Blob([largeBuffer], { type: "text/plain" });
    const formData = new FormData();
    formData.append("files", blob, "large_file.txt");

    const req = new Request("http://localhost/api/upload/ipfs", {
      method: "POST",
      body: formData,
    });

    const response = await app.handle(req);
    expect(response.status).toBe(400);
    
    const data = await response.json() as any;
    expect(data.success).toBe(false);
    expect(data.error).toBe("File large_file.txt exceeds the 5MB limit.");
  });

  test("Should successfully upload a small file to Pinata", async () => {
    // Mock fetch for success
    const originalFetch = global.fetch;
    global.fetch = async () => new Response(JSON.stringify({ IpfsHash: "QmMockHash123456789" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

    const textContent = "Hello from Sawtak automated testing! This is evidence.";
    const blob = new Blob([textContent], { type: "text/plain" });
    const formData = new FormData();
    formData.append("files", blob, "test_evidence.txt");

    const req = new Request("http://localhost/api/upload/ipfs", {
      method: "POST",
      body: formData,
    });

    const response = await app.handle(req);
    expect(response.status).toBe(200);

    const data = await response.json() as any;
    expect(data.success).toBe(true);
    expect(data.message).toBe("Evidence successfully pinned to IPFS.");
    expect(data.ipfs_hashes[0]).toBe("QmMockHash123456789");
    expect(data.urls[0]).toBe("https://gateway.pinata.cloud/ipfs/QmMockHash123456789");

    // Restore fetch
    global.fetch = originalFetch;
  });

  test("Should handle Pinata API failure gracefully", async () => {
    // Mock fetch for failure
    const originalFetch = global.fetch;
    global.fetch = async () => new Response("Forbidden", {
      status: 403,
      statusText: "Forbidden"
    });

    const textContent = "Fail this test";
    const blob = new Blob([textContent], { type: "text/plain" });
    const formData = new FormData();
    formData.append("files", blob, "fail.txt");

    const req = new Request("http://localhost/api/upload/ipfs", {
      method: "POST",
      body: formData,
    });

    const response = await app.handle(req);
    expect(response.status).toBe(500);

    const data = await response.json() as any;
    expect(data.success).toBe(false);
    expect(data.error).toBe("An internal server error occurred during the file upload.");

    // Restore fetch
    global.fetch = originalFetch;
  });

  test("Should upload a real file (p2.png) to Pinata dashboard", async () => {
    // Load the actual file from disk
    const realFile = Bun.file(__dirname + "/test_files/p2.png");
    
    const formData = new FormData();
    formData.append("files", realFile, "/test_files/p2.png");

    const req = new Request("http://localhost/api/upload/ipfs", {
      method: "POST",
      body: formData,
    });

    const response = await app.handle(req);
    const data = await response.json() as any;
    
    if (response.status !== 200) {
      console.error("Real upload failed:", data);
    }

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.ipfs_hashes).toBeDefined();
    
    console.log(`✅ Successfully uploaded p2.png! View it here: ${data.urls[0]}`);
  }, 30000); // 30 second timeout for real upload
});
