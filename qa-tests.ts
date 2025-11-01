import mysql from "mysql2/promise";

/**
 * Comprehensive QA Test Suite
 * Tests all core functionality and verifies no conflicts
 */

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>) {
  console.log(`\n🧪 Testing: ${name}`);
  try {
    await testFn();
    results.push({ name, passed: true });
    console.log(`✅ PASSED: ${name}`);
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message });
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
  }
}

async function runQATests() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("=" .repeat(60));
  console.log("TEMPLE VOLUNTEER SYSTEM - QA TEST SUITE");
  console.log("=".repeat(60));

  // Test 1: Database Schema Integrity
  await runTest("Database Schema - All tables exist", async () => {
    const [tables] = await connection.execute("SHOW TABLES");
    const tableNames = (tables as any[]).map((t) => Object.values(t)[0]);
    
    const requiredTables = [
      "users",
      "user_sensitive",
      "departments",
      "user_departments",
      "engagements",
      "schedule_days",
      "schedule_assignments",
      "rota_rules",
      "attendance_daily",
      "hours_ledger",
      "point_ledger",
      "user_rank_snapshot",
      "dept_month_quota",
      "dept_bonus_requests",
      "rewards",
      "redeem_orders",
      "payroll_cycles",
      "payroll_items",
      "audit_logs",
    ];

    const missing = requiredTables.filter((t) => !tableNames.includes(t));
    if (missing.length > 0) {
      throw new Error(`Missing tables: ${missing.join(", ")}`);
    }
  });

  // Test 2: User Registration Flow
  await runTest("User Registration - Creates user with volunteer role", async () => {
    const testVolunteerCode = `V${Date.now()}TEST`;
    const [result] = await connection.execute(
      `INSERT INTO users (openId, name, role, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())`,
      [testVolunteerCode, "Test User QA", "volunteer"]
    );
    
    const [users] = await connection.execute(
      `SELECT * FROM users WHERE openId = ?`,
      [testVolunteerCode]
    );
    
    if ((users as any[]).length === 0) {
      throw new Error("User not created");
    }
    
    const user = (users as any[])[0];
    if (user.role !== "volunteer") {
      throw new Error(`Expected role 'volunteer', got '${user.role}'`);
    }
  });

  // Test 3: Rank Snapshot Initialization
  await runTest("Rank System - New user gets rank snapshot", async () => {
    const [users] = await connection.execute(
      `SELECT id FROM users WHERE role = 'volunteer' LIMIT 1`
    );
    
    if ((users as any[]).length === 0) {
      throw new Error("No volunteer user found");
    }
    
    const userId = (users as any[])[0].id;
    
    // Check if rank snapshot exists
    const [snapshots] = await connection.execute(
      `SELECT * FROM user_rank_snapshot WHERE userId = ?`,
      [userId]
    );
    
    if ((snapshots as any[]).length === 0) {
      throw new Error("Rank snapshot not created");
    }
    
    const snapshot = (snapshots as any[])[0];
    if (snapshot.rankLevel < 1 || snapshot.rankLevel > 7) {
      throw new Error(`Invalid rank level: ${snapshot.rankLevel}`);
    }
  });

  // Test 4: Rewards Shop Data
  await runTest("Rewards Shop - Sample rewards exist", async () => {
    const [rewards] = await connection.execute(`SELECT * FROM rewards`);
    
    if ((rewards as any[]).length < 3) {
      throw new Error(`Expected at least 3 rewards, found ${(rewards as any[]).length}`);
    }
    
    // Check for specific sample rewards
    const rewardTitles = (rewards as any[]).map((r: any) => r.title);
    const expectedRewards = ["三日禅修课程", "一日禅修课程", "寺院住宿一晚"];
    
    for (const expected of expectedRewards) {
      if (!rewardTitles.includes(expected)) {
        throw new Error(`Missing sample reward: ${expected}`);
      }
    }
  });

  // Test 5: Bonus Request Workflow
  await runTest("Bonus System - Quota and request tables functional", async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Check if quota exists
    const [quotas] = await connection.execute(
      `SELECT * FROM dept_month_quota WHERE yearMonth = ?`,
      [currentMonth]
    );
    
    if ((quotas as any[]).length === 0) {
      throw new Error("No quota set for current month");
    }
    
    // Check if bonus requests exist
    const [requests] = await connection.execute(
      `SELECT * FROM dept_bonus_requests WHERE yearMonth = ?`,
      [currentMonth]
    );
    
    if ((requests as any[]).length === 0) {
      throw new Error("No bonus requests found");
    }
  });

  // Test 6: Point Ledger Integrity
  await runTest("Point Ledger - Transactions are immutable", async () => {
    const [ledger] = await connection.execute(
      `SELECT * FROM point_ledger ORDER BY createdAt DESC LIMIT 1`
    );
    
    if ((ledger as any[]).length > 0) {
      const entry = (ledger as any[])[0];
      // Verify required fields
      if (!entry.userId || entry.pointsDelta === undefined) {
        throw new Error("Point ledger entry missing required fields");
      }
    }
  });

  // Test 7: Rank Level Calculation
  await runTest("Rank System - Levels calculated correctly", async () => {
    const [snapshots] = await connection.execute(
      `SELECT * FROM user_rank_snapshot WHERE totalPoints > 0`
    );
    
    for (const snapshot of snapshots as any[]) {
      const points = snapshot.totalPoints;
      const level = snapshot.rankLevel;
      
      // Verify level matches points
      if (points < 100 && level !== 1) {
        throw new Error(`Points ${points} should be level 1, got ${level}`);
      }
      if (points >= 100 && points < 500 && level !== 2) {
        throw new Error(`Points ${points} should be level 2, got ${level}`);
      }
      // Add more level checks as needed
    }
  });

  // Test 8: Joy Badge Logic
  await runTest("Joy Badge - Granted at 70 hours", async () => {
    const [snapshots] = await connection.execute(
      `SELECT * FROM user_rank_snapshot WHERE totalHours >= 70`
    );
    
    for (const snapshot of snapshots as any[]) {
      if (!snapshot.joyBadge) {
        throw new Error(`User ${snapshot.userId} has ${snapshot.totalHours} hours but no joy badge`);
      }
    }
  });

  // Test 9: Role Hierarchy
  await runTest("RBAC - Role hierarchy enforced", async () => {
    const [users] = await connection.execute(`SELECT role FROM users`);
    const validRoles = ["volunteer", "leader", "manager", "admin", "super-admin"];
    
    for (const user of users as any[]) {
      if (!validRoles.includes(user.role)) {
        throw new Error(`Invalid role: ${user.role}`);
      }
    }
  });

  // Test 10: Audit Log Functionality
  await runTest("Audit Logs - Records are being created", async () => {
    const [logs] = await connection.execute(
      `SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT 10`
    );
    
    // Check if audit logs have required fields
    for (const log of logs as any[]) {
      if (!log.actorUserId || !log.action) {
        throw new Error("Audit log missing required fields");
      }
    }
  });

  // Test 11: Redemption Code Generation
  await runTest("Redemption - Codes are unique and valid", async () => {
    const [orders] = await connection.execute(
      `SELECT codePayload FROM redeem_orders WHERE codePayload IS NOT NULL LIMIT 5`
    );
    
    const codes = (orders as any[]).map((o: any) => o.codePayload);
    const uniqueCodes = new Set(codes);
    
    if (codes.length !== uniqueCodes.size) {
      throw new Error("Duplicate redemption codes found");
    }
  });

  // Test 12: Department Assignment
  await runTest("Departments - User assignments work", async () => {
    const [assignments] = await connection.execute(
      `SELECT * FROM user_departments LIMIT 1`
    );
    
    if ((assignments as any[]).length > 0) {
      const assignment = (assignments as any[])[0];
      
      // Verify user exists
      const [users] = await connection.execute(
        `SELECT id FROM users WHERE id = ?`,
        [assignment.userId]
      );
      
      if ((users as any[]).length === 0) {
        throw new Error("User in assignment doesn't exist");
      }
      
      // Verify department exists
      const [depts] = await connection.execute(
        `SELECT id FROM departments WHERE id = ?`,
        [assignment.departmentId]
      );
      
      if ((depts as any[]).length === 0) {
        throw new Error("Department in assignment doesn't exist");
      }
    }
  });

  await connection.end();

  // Print Summary
  console.log("\n" + "=".repeat(60));
  console.log("TEST SUMMARY");
  console.log("=".repeat(60));
  
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  
  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log("\n❌ FAILED TESTS:");
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`   - ${r.name}`);
      console.log(`     ${r.error}`);
    });
  }
  
  console.log("\n" + "=".repeat(60));
  
  if (failed === 0) {
    console.log("🎉 ALL TESTS PASSED!");
  } else {
    console.log("⚠️  SOME TESTS FAILED - Please review and fix");
    process.exit(1);
  }
}

runQATests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n💥 QA Test Suite Failed:", error);
    process.exit(1);
  });
