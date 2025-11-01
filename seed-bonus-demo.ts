import mysql from "mysql2/promise";

async function seedBonusDemo() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("Setting up bonus management demo data...");

  try {
    // Set monthly quota for department 1 (图书馆) for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    console.log(`Creating quota for department 1, month: ${currentMonth}`);
    await connection.execute(`
      INSERT IGNORE INTO dept_month_quota (departmentId, yearMonth, quotaPoints, approvedBy)
      VALUES (1, '${currentMonth}', 1000, 4)
    `);

    // Create a pending bonus request from manager (user 3) for volunteer (user 1)
    console.log("Creating pending bonus request...");
    await connection.execute(`
      INSERT INTO dept_bonus_requests (departmentId, yearMonth, userId, points, reasonText, status, createdBy, updatedBy, updatedAt)
      VALUES (1, '${currentMonth}', 1, 200, '在图书整理工作中表现突出，主动加班完成紧急任务', 'pending', 3, 3, NOW())
    `);

    console.log("\n✅ Bonus demo data created!");
    console.log("\nDemo scenario:");
    console.log("- Department: 图书馆 (ID: 1)");
    console.log(`- Month: ${currentMonth}`);
    console.log("- Quota: 1000 points");
    console.log("- Pending request: 200 points for 张三 (volunteer)");
    console.log("- Reason: 在图书整理工作中表现突出，主动加班完成紧急任务");
    console.log("\nAs admin, you can now:");
    console.log("1. View pending bonus requests");
    console.log("2. Approve or reject the request");
    console.log("3. Upon approval, 张三 will receive 200 bonus points");
  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedBonusDemo()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
