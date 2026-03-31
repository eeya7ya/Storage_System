/**
 * Seed script — creates the default admin user.
 * Run with: npx tsx src/scripts/seed.ts
 * Requires DATABASE_URL in environment.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../db/schema.js";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("🌱 Starting seed...");

  const passwordHash = await bcrypt.hash("admin123", 12);

  try {
    const [admin] = await db
      .insert(schema.users)
      .values({
        username: "admin",
        fullName: "مدير النظام",
        passwordHash,
        role: "admin",
        isActive: true,
      })
      .onConflictDoNothing()
      .returning({ id: schema.users.id, username: schema.users.username });

    if (admin) {
      console.log(`✅ Admin user created: ${admin.username} (ID: ${admin.id})`);
      console.log("   Username: admin");
      console.log("   Password: admin123");
      console.log("   ⚠️  Change this password immediately after first login!");
    } else {
      console.log("ℹ️  Admin user already exists, skipping.");
    }

    // Create a test supervisor
    const hash2 = await bcrypt.hash("supervisor123", 12);
    await db
      .insert(schema.users)
      .values({
        username: "supervisor1",
        fullName: "مشرف الفرع الرئيسي",
        passwordHash: hash2,
        role: "supervisor",
        branch: "الفرع الرئيسي",
        isActive: true,
      })
      .onConflictDoNothing();

    // Create a test cashier
    const hash3 = await bcrypt.hash("cashier123", 12);
    await db
      .insert(schema.users)
      .values({
        username: "cashier1",
        fullName: "كاشير الفرع الرئيسي",
        passwordHash: hash3,
        role: "cashier",
        branch: "الفرع الرئيسي",
        isActive: true,
      })
      .onConflictDoNothing();

    console.log("✅ Test users created.");
    console.log("\nTest credentials:");
    console.log("  admin / admin123");
    console.log("  supervisor1 / supervisor123");
    console.log("  cashier1 / cashier123");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }

  console.log("\n✅ Seed complete!");
  process.exit(0);
}

void seed();
