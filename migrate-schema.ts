import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

async function migrateSchema() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  console.log("Starting schema migration...");

  try {
    // Drop old columns from users table
    await connection.execute("ALTER TABLE users DROP COLUMN IF EXISTS email");
    await connection.execute("ALTER TABLE users DROP COLUMN IF EXISTS loginMethod");
    await connection.execute("ALTER TABLE users DROP COLUMN IF EXISTS lastSignedIn");
    console.log("✓ Dropped old columns from users table");

    // Add new columns if they don't exist
    try {
      await connection.execute("ALTER TABLE users ADD COLUMN unionId VARCHAR(64) NULL AFTER openId");
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }
    
    try {
      await connection.execute("ALTER TABLE users ADD COLUMN volunteerCode VARCHAR(32) NULL");
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }
    
    try {
      await connection.execute("ALTER TABLE users ADD COLUMN avatarUrl VARCHAR(255) NULL");
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }
    
    try {
      await connection.execute("ALTER TABLE users ADD COLUMN phone VARCHAR(32) NULL");
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }
    console.log("✓ Added new columns to users table");

    // Add unique constraint for volunteerCode if not exists
    try {
      await connection.execute("ALTER TABLE users ADD UNIQUE KEY unique_volunteerCode (volunteerCode)");
    } catch (e) {
      // Constraint might already exist
    }

    // Add unique constraint for unionId if not exists  
    try {
      await connection.execute("ALTER TABLE users ADD UNIQUE KEY unique_unionId (unionId)");
    } catch (e) {
      // Constraint might already exist
    }

    console.log("✓ Schema migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

migrateSchema()
  .then(() => {
    console.log("Migration complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
