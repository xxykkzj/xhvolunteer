import { getDb } from "../server/db";

async function addScheduleFields() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  try {
    // Add shiftStart, shiftEnd, and requiredCount to schedule_days
    await db.execute(`
      ALTER TABLE schedule_days
      ADD COLUMN shiftStart VARCHAR(8),
      ADD COLUMN shiftEnd VARCHAR(8),
      ADD COLUMN requiredCount INT DEFAULT 1
    `);

    console.log("✅ Successfully added shiftStart, shiftEnd, and requiredCount to schedule_days");

    process.exit(0);
  } catch (error: any) {
    if (error.message.includes("Duplicate column name")) {
      console.log("✅ Columns already exist");
      process.exit(0);
    }
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

addScheduleFields();
