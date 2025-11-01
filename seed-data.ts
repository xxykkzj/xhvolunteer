import mysql from "mysql2/promise";

async function seedData() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("Seeding initial data...");

  try {
    // Create departments
    console.log("Creating departments...");
    await connection.execute(
      "INSERT IGNORE INTO departments (id, name, centerId, createdAt) VALUES (1, '图书馆', NULL, NOW())"
    );
    await connection.execute(
      "INSERT IGNORE INTO departments (id, name, centerId, createdAt) VALUES (2, '福田中心', NULL, NOW())"
    );
    await connection.execute(
      "INSERT IGNORE INTO departments (id, name, centerId, createdAt) VALUES (3, '客房部', NULL, NOW())"
    );

    // Create sample users with different roles
    console.log("Creating sample users...");
    
    // Volunteer
    await connection.execute(`
      INSERT IGNORE INTO users (id, openId, name, role, createdAt, updatedAt)
      VALUES (1, 'volunteer001', '张三', 'volunteer', NOW(), NOW())
    `);

    // Leader
    await connection.execute(`
      INSERT IGNORE INTO users (id, openId, name, role, createdAt, updatedAt)
      VALUES (2, 'leader001', '李四', 'leader', NOW(), NOW())
    `);

    // Manager
    await connection.execute(`
      INSERT IGNORE INTO users (id, openId, name, role, createdAt, updatedAt)
      VALUES (3, 'manager001', '王五', 'manager', NOW(), NOW())
    `);

    // Admin
    await connection.execute(`
      INSERT IGNORE INTO users (id, openId, name, role, createdAt, updatedAt)
      VALUES (4, 'admin001', '赵六', 'admin', NOW(), NOW())
    `);

    // Super Admin
    await connection.execute(`
      INSERT IGNORE INTO users (id, openId, name, role, createdAt, updatedAt)
      VALUES (5, 'superadmin001', '方丈助理', 'super-admin', NOW(), NOW())
    `);

    // Initialize rank snapshots for all users
    console.log("Initializing user rank snapshots...");
    for (let userId = 1; userId <= 5; userId++) {
      await connection.execute(`
        INSERT IGNORE INTO user_rank_snapshot (userId, totalHours, totalPoints, rankLevel, joyBadge, updatedAt)
        VALUES (${userId}, 0, 0, 1, FALSE, NOW())
      `);
    }

    // Create sample rewards
    console.log("Creating sample rewards...");
    
    // Reward A: 结缘书籍
    await connection.execute(`
      INSERT IGNORE INTO rewards (id, title, description, pointsCost, minLevelRequired, requireJoyBadge, stock, status, createdBy, createdAt)
      VALUES (1, '结缘书籍', '精选佛学经典书籍一本', 100, 1, FALSE, -1, 'active', 4, NOW())
    `);

    // Reward B: 福田义工餐券
    await connection.execute(`
      INSERT IGNORE INTO rewards (id, title, description, pointsCost, minLevelRequired, requireJoyBadge, stock, status, createdBy, createdAt)
      VALUES (2, '福田义工餐券', '福田中心素食餐券一张', 300, 3, TRUE, 50, 'active', 4, NOW())
    `);

    // Reward C: 禅修日体验
    await connection.execute(`
      INSERT IGNORE INTO rewards (id, title, description, pointsCost, minLevelRequired, requireJoyBadge, stock, status, createdBy, createdAt)
      VALUES (3, '禅修日体验', '一日禅修体验活动名额', 800, 5, TRUE, 20, 'active', 4, NOW())
    `);

    // Additional rewards
    await connection.execute(`
      INSERT IGNORE INTO rewards (id, title, description, pointsCost, minLevelRequired, requireJoyBadge, stock, status, createdBy, createdAt)
      VALUES (4, '寺院参观券', '寺院深度参观导览', 50, 1, FALSE, -1, 'active', 4, NOW())
    `);

    await connection.execute(`
      INSERT IGNORE INTO rewards (id, title, description, pointsCost, minLevelRequired, requireJoyBadge, stock, status, createdBy, createdAt)
      VALUES (5, '法会参与资格', '重要法会参与资格', 500, 4, TRUE, 30, 'active', 4, NOW())
    `);

    await connection.execute(`
      INSERT IGNORE INTO rewards (id, title, description, pointsCost, minLevelRequired, requireJoyBadge, stock, status, createdBy, createdAt)
      VALUES (6, '禅茶体验', '禅茶一味体验活动', 200, 2, FALSE, 40, 'active', 4, NOW())
    `);

    // Give volunteer some sample data
    console.log("Adding sample points and hours for volunteer...");
    
    // Add some hours
    await connection.execute(`
      INSERT IGNORE INTO hours_ledger (id, userId, date, hoursDelta, reason, createdBy, createdAt)
      VALUES (1, 1, NOW(), 1800, 'attendance', 2, NOW())
    `); // 30 hours

    await connection.execute(`
      INSERT IGNORE INTO hours_ledger (id, userId, date, hoursDelta, reason, createdBy, createdAt)
      VALUES (2, 1, DATE_SUB(NOW(), INTERVAL 7 DAY), 1200, 'attendance', 2, NOW())
    `); // 20 hours

    // Add some points
    await connection.execute(`
      INSERT IGNORE INTO point_ledger (id, userId, pointsDelta, reason, createdBy, createdAt)
      VALUES (1, 1, 300, 'attendance_eval', 2, NOW())
    `);

    await connection.execute(`
      INSERT IGNORE INTO point_ledger (id, userId, pointsDelta, reason, createdBy, createdAt)
      VALUES (2, 1, 200, 'attendance_eval', 2, DATE_SUB(NOW(), INTERVAL 7 DAY))
    `);

    // Update volunteer's rank snapshot
    await connection.execute(`
      UPDATE user_rank_snapshot 
      SET totalHours = 3000, totalPoints = 500, rankLevel = 3, updatedAt = NOW()
      WHERE userId = 1
    `);

    console.log("✓ Seed data created successfully!");
    console.log("\nSample accounts:");
    console.log("- Volunteer: openId = volunteer001, name = 张三");
    console.log("- Leader: openId = leader001, name = 李四");
    console.log("- Manager: openId = manager001, name = 王五");
    console.log("- Admin: openId = admin001, name = 赵六");
    console.log("- Super Admin: openId = superadmin001, name = 方丈助理");
    console.log("\nDepartments: 图书馆, 福田中心, 客房部");
    console.log("Rewards: 6 sample rewards created");
  } catch (error) {
    console.error("Seed data failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedData()
  .then(() => {
    console.log("\nSeeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
