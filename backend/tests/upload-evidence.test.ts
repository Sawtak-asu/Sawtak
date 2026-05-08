import { describe, expect, it, afterEach, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { uploadEvidenceRoutes } from "../src/routes/upload-evidence.routes";

process.env.PINATA_JWT = "mock-pinata-jwt-for-testing";

const app = new Elysia().use(uploadEvidenceRoutes);

beforeAll(() => {
  process.env.PINATA_JWT = "mock-pinata-jwt-for-testing";
});

describe("Upload Evidence Route Test", () => {
  afterEach(() => {
    globalThis.fetch = fetch;
  });

  it("Should fail if file is larger than 50MB", async () => {
    const largeBuffer = new Uint8Array(51 * 1024 * 1024);
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
    expect(data.error).toBe("File large_file.txt exceeds the 50MB limit.");
  });

  it("Should fail if no files provided", async () => {
    const formData = new FormData();
    const req = new Request("http://localhost/api/upload/ipfs", {
      method: "POST",
      body: formData,
    });

    const response = await app.handle(req);
    expect(response.status).toBe(400);

    const data = await response.json() as any;
    expect(data.success).toBe(false);
    expect(data.error).toBe("No files provided.");
  });

  it("Should successfully upload a small file with mocked Pinata", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({ IpfsHash: "QmMockHash123456789" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );

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
  });

  it("Should handle Pinata API failure gracefully", async () => {
    globalThis.fetch = async () =>
      new Response("Forbidden", {
        status: 403,
        statusText: "Forbidden",
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
  });

  it("Should handle Pinata network error gracefully", async () => {
    globalThis.fetch = async () => {
      throw new Error("Network error: connection refused");
    };

    const blob = new Blob(["network fail"], { type: "text/plain" });
    const formData = new FormData();
    formData.append("files", blob, "network-fail.txt");

    const req = new Request("http://localhost/api/upload/ipfs", {
      method: "POST",
      body: formData,
    });

    const response = await app.handle(req);
    expect(response.status).toBe(500);

    const data = await response.json() as any;
    expect(data.success).toBe(false);
  });

  it("Should upload multiple files and return multiple IPFS hashes", async () => {
    let callCount = 0;
    const mockHashes = ["QmHash1", "QmHash2", "QmHash3"];
    globalThis.fetch = async () => {
      const hash = mockHashes[callCount % mockHashes.length];
      callCount++;
      return new Response(JSON.stringify({ IpfsHash: hash }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const formData = new FormData();
    formData.append("files", new Blob(["file1"]), "doc1.pdf");
    formData.append("files", new Blob(["file2"]), "image.png");
    formData.append("files", new Blob(["file3"]), "video.mp4");

    const req = new Request("http://localhost/api/upload/ipfs", {
      method: "POST",
      body: formData,
    });

    const response = await app.handle(req);
    expect(response.status).toBe(200);

    const data = await response.json() as any;
    expect(data.success).toBe(true);
    expect(data.ipfs_hashes).toHaveLength(3);
    expect(data.urls).toHaveLength(3);
    expect(data.urls[0]).toBe("https://gateway.pinata.cloud/ipfs/QmHash1");
    expect(data.urls[1]).toBe("https://gateway.pinata.cloud/ipfs/QmHash2");
    expect(data.urls[2]).toBe("https://gateway.pinata.cloud/ipfs/QmHash3");
  });

  it("Should handle partial failure when uploading multiple files", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      if (callCount === 1) {
        return new Response(JSON.stringify({ IpfsHash: "QmSuccess" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("Rate limited", { status: 429 });
    };

    const formData = new FormData();
    formData.append("files", new Blob(["first"]), "first.txt");
    formData.append("files", new Blob(["second"]), "second.txt");

    const req = new Request("http://localhost/api/upload/ipfs", {
      method: "POST",
      body: formData,
    });

    const response = await app.handle(req);
    expect(response.status).toBe(500);
    const data = await response.json() as any;
    expect(data.success).toBe(false);
  });
});
