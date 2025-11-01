import mysql from "mysql2/promise";

async function seedShopRewards() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("Adding shop rewards...");

  try {
    // Add 3-day course
    await connection.execute(`
      INSERT INTO rewards (title, description, pointsCost, minLevelRequired, requireJoyBadge, stock, createdBy, createdAt)
      VALUES ('三日禅修课程', '为期三天的深度禅修体验课程，包含禅坐、行禅、法师开示等内容', 100, 1, FALSE, 20, 4, NOW())
      ON DUPLICATE KEY UPDATE title=title
    `);

    // Add 1-day course
    await connection.execute(`
      INSERT INTO rewards (title, description, pointsCost, minLevelRequired, requireJoyBadge, stock, createdBy, createdAt)
      VALUES ('一日禅修课程', '一日禅修体验课程，适合初学者了解禅修基础', 40, 1, FALSE, 50, 4, NOW())
      ON DUPLICATE KEY UPDATE title=title
    `);

    // Add overnight stay
    await connection.execute(`
      INSERT INTO rewards (title, description, pointsCost, minLevelRequired, requireJoyBadge, stock, createdBy, createdAt)
      VALUES ('寺院住宿一晚', '寺院客房住宿一晚，体验寺院清净生活', 25, 1, FALSE, 30, 4, NOW())
      ON DUPLICATE KEY UPDATE title=title
    `);

    console.log("✅ Shop rewards added successfully!");
    console.log("\nRewards created:");
    console.log("- 三日禅修课程: 100 points");
    console.log("- 一日禅修课程: 40 points");
    console.log("- 寺院住宿一晚: 25 points");
  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedShopRewards()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
