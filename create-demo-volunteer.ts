import mysql from "mysql2/promise";
import { updateUserRankSnapshot } from "../server/services/rank";

async function createDemoVolunteer() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  const testCode = "DEMO2025";
  const testName = "Demo Volunteer";

  console.log("Creating demo volunteer...");

  // Create demo volunteer
  await conn.execute(
    `INSERT INTO users (openId, name, phone, role, createdAt, updatedAt) 
     VALUES (?, ?, ?, 'volunteer', NOW(), NOW()) 
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [testCode, testName, "13800138000"]
  );

  const [users] = await conn.execute(
    "SELECT id FROM users WHERE openId = ?",
    [testCode]
  );
  const userId = (users as any[])[0].id;

  console.log(`✅ User created with ID: ${userId}`);

  // Create rank snapshot
  await updateUserRankSnapshot(userId);
  console.log("✅ Rank snapshot created");

  // Add some demo points and hours
  await conn.execute(
    `INSERT INTO point_ledger (userId, pointsDelta, reason, createdBy, createdAt) 
     VALUES (?, 50, 'dept_bonus', ?, NOW())`,
    [userId, userId]
  );

  await conn.execute(
    `INSERT INTO hours_ledger (userId, date, hoursDelta, reason, createdBy, createdAt) 
     VALUES (?, NOW(), 10, 'attendance', ?, NOW())`,
    [userId, userId]
  );

  console.log("✅ Added 50 points and 10 hours");

  // Update rank snapshot with new totals
  await updateUserRankSnapshot(userId);

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEMO VOLUNTEER CREATED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log("\n📋 Login Credentials:");
  console.log(`   Volunteer Code: ${testCode}`);
  console.log(`   Name: ${testName}`);
  console.log(`   Phone: 13800138000`);
  console.log("\n📊 Initial Stats:");
  console.log("   Points: 50");
  console.log("   Hours: 10");
  console.log("   Level: 1 (欢喜地)");
  console.log("\n🔑 How to Test:");
  console.log("   1. Click '志愿者登录' button on homepage");
  console.log("   2. Enter volunteer code: DEMO2025");
  console.log("   3. Click '登录' to sign in");
  console.log("\n" + "=".repeat(60));

  await conn.end();
}

createDemoVolunteer()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error creating demo volunteer:", error);
    process.exit(1);
  });
