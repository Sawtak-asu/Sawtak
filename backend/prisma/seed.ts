import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function generateAnonymousId(seed: string): string {
  const hash = createHash("sha256");
  hash.update(seed);
  return `anon_${hash.digest("hex").substring(0, 12)}`;
}

const SEED_USERS = [
  {
    email: "platform_admin@sawtak.app",
    name: "Platform Admin",
    role: "platform_admin",
    auth_provider: "email",
  },
  {
    email: "admin@sawtak.app",
    name: "System Admin",
    role: "admin",
    auth_provider: "email",
  },
  {
    email: "team_admin@sawtak.app",
    name: "Team Admin User",
    role: "admin",
    auth_provider: "email",
  },
  {
    email: "manager@sawtak.app",
    name: "Team Manager",
    role: "user",
    auth_provider: "email",
  },
  {
    email: "reviewer@sawtak.app",
    name: "Team Reviewer",
    role: "user",
    auth_provider: "email",
  },
  {
    email: "user@sawtak.app",
    name: "Regular User",
    role: "user",
    auth_provider: "email",
  },
];

const PASSWORD = "password123";

async function main() {
  console.log("🌱 Seeding database...\n");

  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  const createdUsers: Record<string, any> = {};

  for (const u of SEED_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: {
        email: u.email,
        password: hashedPassword,
        name: u.name,
        role: u.role,
        anonymous_identifier: generateAnonymousId(u.email),
        auth_provider: u.auth_provider,
      },
    });
    createdUsers[u.email] = user;
    console.log(`  ✅ ${u.role.padEnd(16)} ${u.email.padEnd(35)} ${user.id}`);
  }

  const team = await prisma.team.upsert({
    where: { entity_id: "ministry-of-justice" },
    update: { type: "ministry" },
    create: {
      entity_id: "ministry-of-justice",
      type: "ministry",
    },
  });
  console.log(`\n  ✅ Team created: ${team.type} (${team.entity_id})`);

  const teamMemberships = [
    { email: "team_admin@sawtak.app", role: "team_admin" },
    { email: "manager@sawtak.app", role: "manager" },
    { email: "reviewer@sawtak.app", role: "reviewer" },
  ];

  for (const m of teamMemberships) {
    const user = createdUsers[m.email];
    if (!user) continue;
    await prisma.teamMember.upsert({
      where: { user_id_team_id: { user_id: user.id, team_id: team.id } },
      update: { role: m.role },
      create: {
        user_id: user.id,
        team_id: team.id,
        role: m.role,
      },
    });
    console.log(`  ✅ ${m.role.padEnd(16)} ${m.email} → ${team.type}`);
  }

  console.log("\n┌──────────────────────────────────────────────────────────────┐");
  console.log("│  Seed complete! Log in with any account:                     │");
  console.log("│  Password: password123                                       │");
  console.log("│                                                              │");
  console.log("│  Accounts:                                                   │");
  console.log("│  platform_admin@sawtak.app  — super admin                    │");
  console.log("│  admin@sawtak.app           — system admin                   │");
  console.log("│  team_admin@sawtak.app      — team admin (Ministry of Justice)│");
  console.log("│  manager@sawtak.app         — team manager                   │");
  console.log("│  reviewer@sawtak.app        — team reviewer                  │");
  console.log("│  user@sawtak.app            — regular user                   │");
  console.log("└──────────────────────────────────────────────────────────────┘");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
