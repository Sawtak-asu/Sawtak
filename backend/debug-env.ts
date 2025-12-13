import { readFileSync } from "fs";
import { parse } from "dotenv";

console.log("Current Directory:", process.cwd());

try {
  const envContent = readFileSync(".env", "utf-8");
  console.log(".env file found. Length:", envContent.length);
  const parsed = parse(envContent);
  console.log("Parsed keys:", Object.keys(parsed));
  console.log("Parsed GOOGLE_CLIENT_ID:", parsed.GOOGLE_CLIENT_ID);
} catch (e: any) {
  console.error("Error reading .env:", e.message);
}

console.log("Bun.env.GOOGLE_CLIENT_ID:", Bun.env.GOOGLE_CLIENT_ID);
