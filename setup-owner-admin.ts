import mysql from "mysql2/promise";

async function setupOwnerAdmin() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);

  const ownerOpenId = process.env.OWNER_OPEN_ID;
  const ownerName = process.env.OWNER_NAME;

  if (!ownerOpenId || !ownerName) {
    console.error("Missing OWNER_OPEN_ID or OWNER_NAME environment variables");
    process.exit(1);
  }

  console.log(`Setting up owner as admin: ${ownerName} (${ownerOpenId})`);

  try {
    // Check if owner user exists
    const [rows] = await connection.execute(
      "SELECT id, role FROM users WHERE openId = ?",
      [ownerOpenId]
    );

    if ((rows as any[]).length > 0) {
      const user = (rows as any[])[0];
      console.log(`Owner user found with ID: ${user.id}, current role: ${user.role}`);
      
      // Update to admin role
      await connection.execute(
        "UPDATE users SET role = 'admin' WHERE openId = ?",
        [ownerOpenId]
      );
      console.log("✓ Owner role updated to admin");

      // Initialize rank snapshot if not exists
      await connection.execute(`
        INSERT IGNORE INTO user_rank_snapshot (userId, totalHours, totalPoints, rankLevel, joyBadge, updatedAt)
        VALUES (${user.id}, 0, 0, 1, FALSE, NOW())
      `);
      console.log("✓ Rank snapshot initialized");
    } else {
      console.log("Owner user not found, creating new admin user...");
      
      // Create owner user with admin role
      await connection.execute(`
        INSERT INTO users (openId, name, role, createdAt, updatedAt)
        VALUES (?, ?, 'admin', NOW(), NOW())
      `, [ownerOpenId, ownerName]);
      
      console.log("✓ Owner admin user created");

      // Get the new user ID
      const [newRows] = await connection.execute(
        "SELECT id FROM users WHERE openId = ?",
        [ownerOpenId]
      );
      const userId = (newRows as any[])[0].id;

      // Initialize rank snapshot
      await connection.execute(`
        INSERT INTO user_rank_snapshot (userId, totalHours, totalPoints, rankLevel, joyBadge, updatedAt)
        VALUES (${userId}, 0, 0, 1, FALSE, NOW())
      `);
      console.log("✓ Rank snapshot initialized");
    }

    console.log("\n✅ Setup complete! You can now login with your Manus account.");
    console.log(`   OpenID: ${ownerOpenId}`);
    console.log(`   Name: ${ownerName}`);
    console.log(`   Role: admin`);
  } catch (error) {
    console.error("Setup failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

setupOwnerAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
