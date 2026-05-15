import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function seedNationalId(email: string): string {
  const hash = createHash("sha256").update(email).digest("hex").substring(0, 14);
  return `2${hash.replace(/\D/g, "").padEnd(13, "0").substring(0, 13)}`;
}

const SEED_USERS = [
  {
    email: "platform_admin@sawtak.app",
    name: "Platform Admin",
  },
  {
    email: "admin@sawtak.app",
    name: "System Admin",
  },
  {
    email: "team_admin@sawtak.app",
    name: "Team Admin User",
  },
  {
    email: "manager@sawtak.app",
    name: "Team Manager",
  },
  {
    email: "reviewer@sawtak.app",
    name: "Team Reviewer",
  },
  {
    email: "user@sawtak.app",
    name: "Regular User",
  },
];

async function main() {
  console.log("🌱 Seeding Haweya database...\n");

  for (const u of SEED_USERS) {
    const user = await prisma.haweyaUser.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: {
        email: u.email,
        password: "password123",
        name: u.name,
        national_id: seedNationalId(u.email),
      },
    });
    console.log(`  ✅ ${u.email.padEnd(35)} ${user.id.slice(0, 8)}...  (National ID: ${user.national_id})`);
  }

  console.log("\n┌──────────────────────────────────────────────────────────────┐");
  console.log("│  Haweya seed complete!                                      │");
  console.log("│  Password for all accounts: password123                      │");
  console.log("│                                                              │");
  console.log("│  These match the backend seed accounts — login via Haweya    │");
  console.log("│  OAuth will work with email + password123.                    │");
  console.log("└──────────────────────────────────────────────────────────────┘");
}

main()
  .catch((e) => {
    console.error("❌ Haweya seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
