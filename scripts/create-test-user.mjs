/**
 * Test kullanıcısı oluşturma scripti
 * Kullanım: node scripts/create-test-user.mjs
 *
 * Clerk'te kullanıcı oluşturur + Railway PostgreSQL'e direkt DB kaydı yazar.
 * (Webhook lokal çalışmadığı için DB kaydını manuel yazıyoruz.)
 */

import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// .env.local'ı oku
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const envLines = readFileSync(envPath, "utf-8").split("\n");
for (const line of envLines) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) {
    process.env[key.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
  }
}

const TEST_USER = {
  username:  "testadmin",
  email:     "testadmin@journey.dev",
  password:  "Journey2026!",
  displayName: "Test Admin",
};

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const db = new PrismaClient();

async function main() {
  console.log("→ Clerk kullanıcısı oluşturuluyor...");

  // Var mı kontrol et
  const existing = await clerk.users.getUserList({ emailAddress: [TEST_USER.email] });
  let clerkUser;

  if (existing.data.length > 0) {
    clerkUser = existing.data[0];
    console.log(`  ↳ Zaten var: ${clerkUser.id}`);
  } else {
    clerkUser = await clerk.users.createUser({
      username:      TEST_USER.username,
      emailAddress:  [TEST_USER.email],
      password:      TEST_USER.password,
      skipPasswordChecks: false,
      publicMetadata: { role: "artist" },
    });
    console.log(`  ↳ Oluşturuldu: ${clerkUser.id}`);
  }

  console.log("→ DB kaydı yazılıyor...");
  await db.user.upsert({
    where: { id: clerkUser.id },
    update: {},
    create: {
      id:          clerkUser.id,
      username:    TEST_USER.username,
      displayName: TEST_USER.displayName,
    },
  });
  console.log("  ↳ DB kaydı tamam.");

  console.log("\n✅ Test kullanıcısı hazır:");
  console.log(`   E-posta : ${TEST_USER.email}`);
  console.log(`   Şifre   : ${TEST_USER.password}`);
  console.log(`   URL     : http://localhost:3000/login`);
}

main()
  .catch((e) => { console.error("HATA:", e.message); process.exit(1); })
  .finally(() => db.$disconnect());
