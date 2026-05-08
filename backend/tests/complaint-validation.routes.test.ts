import { describe, it, expect } from "bun:test";
import { Elysia, t } from "elysia";

describe("Complaint Validation Routes - Route Layer Tests", () => {
  const validationApp = new Elysia({ prefix: "/api/complaints" })
    .post(
      "/validate",
      async ({ body, set }) => {
        const { title, text, category } = body as any;
        if (!title || !text || !category) {
          set.status = 400;
          return { success: false, error: "title, text, and category are required for validation" };
        }
        return { success: true, verdict: "real", message: "Complaint passed AI validation" };
      },
      {
        body: t.Object({
          title: t.String({ minLength: 1 }),
          text: t.String({ minLength: 1 }),
          category: t.String(),
        }),
      }
    );

  it("returns 200 with real verdict for valid complaint", async () => {
    const req = new Request("http://localhost/api/complaints/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Corruption", text: "Bribery at office", category: "corruption" }),
    });
    const res = await validationApp.handle(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.verdict).toBe("real");
  });

  it("rejects when title is missing (Elysia validation)", async () => {
    const req = new Request("http://localhost/api/complaints/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Bribery at office", category: "corruption" }),
    });
    const res = await validationApp.handle(req);
    expect(res.status).toBe(422);
  });

  it("rejects when text is missing (Elysia validation)", async () => {
    const req = new Request("http://localhost/api/complaints/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Corruption", category: "corruption" }),
    });
    const res = await validationApp.handle(req);
    expect(res.status).toBe(422);
  });

  it("rejects when category is missing (Elysia validation)", async () => {
    const req = new Request("http://localhost/api/complaints/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Corruption", text: "Bribery at office" }),
    });
    const res = await validationApp.handle(req);
    expect(res.status).toBe(422);
  });

  it("rejects empty title (minLength validation)", async () => {
    const req = new Request("http://localhost/api/complaints/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "", text: "Bribery", category: "corruption" }),
    });
    const res = await validationApp.handle(req);
    expect(res.status).toBe(422);
  });

  it("rejects non-JSON body", async () => {
    const req = new Request("http://localhost/api/complaints/validate", {
      method: "POST",
      body: "not json",
    });
    const res = await validationApp.handle(req);
    expect(res.status).toBe(422);
  });
});
