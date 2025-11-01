import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

async function createAllTables() {
  // Debug: Check if DATABASE_URL is loaded
  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL is not set!");
    console.error("Please check that .env file exists and contains DATABASE_URL");
    console.error("Current working directory:", process.cwd());
    process.exit(1);
  }

  console.log("✓ DATABASE_URL loaded successfully");
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);

  console.log("Creating all tables for volunteer management system...");

  try {
    // Create all new tables
    const tables = [
      `CREATE TABLE IF NOT EXISTS user_sensitive (
        userId BIGINT PRIMARY KEY,
        idCardEncrypted TEXT NOT NULL,
        idCardLast4 CHAR(4) NOT NULL,
        emergencyContactName VARCHAR(64),
        emergencyContactPhone VARCHAR(32),
        FOREIGN KEY (userId) REFERENCES users(id)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS departments (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(64) UNIQUE NOT NULL,
        centerId BIGINT,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS user_departments (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        userId BIGINT NOT NULL,
        departmentId BIGINT NOT NULL,
        isPrimary BOOLEAN NOT NULL DEFAULT TRUE,
        UNIQUE KEY uk_user_dept(userId, departmentId),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (departmentId) REFERENCES departments(id)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS engagements (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        userId BIGINT NOT NULL,
        type ENUM('volunteer_shortterm','temple_worker') NOT NULL,
        departmentId BIGINT NOT NULL,
        title VARCHAR(64),
        startDate DATETIME NOT NULL,
        endDate DATETIME,
        hourlyRate INT DEFAULT 0,
        salaryScheme ENUM('hourly','fixed','none') NOT NULL DEFAULT 'none',
        fixedMonthly INT DEFAULT 0,
        allowPointsOnPaidHours BOOLEAN NOT NULL DEFAULT FALSE,
        status ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (departmentId) REFERENCES departments(id),
        INDEX idx_engagement_user (userId, status),
        INDEX idx_engagement_dept (departmentId, status)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS schedule_days (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        theDate DATETIME NOT NULL,
        departmentId BIGINT NOT NULL,
        note VARCHAR(255),
        UNIQUE KEY uk_dept_date(departmentId, theDate),
        FOREIGN KEY (departmentId) REFERENCES departments(id)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS schedule_assignments (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        scheduleDayId BIGINT NOT NULL,
        userId BIGINT NOT NULL,
        plannedHours INT DEFAULT 0,
        roleOnDuty ENUM('volunteer','leader') DEFAULT 'volunteer',
        engagementId BIGINT,
        UNIQUE KEY uk_sched_user(scheduleDayId, userId),
        FOREIGN KEY (scheduleDayId) REFERENCES schedule_days(id),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (engagementId) REFERENCES engagements(id)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS rota_rules (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        engagementId BIGINT NOT NULL,
        weekday INT NOT NULL,
        startTime VARCHAR(8) NOT NULL,
        endTime VARCHAR(8) NOT NULL,
        effectiveFrom DATETIME NOT NULL,
        effectiveTo DATETIME,
        FOREIGN KEY (engagementId) REFERENCES engagements(id),
        INDEX idx_rota_engagement (engagementId, weekday)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS attendance_daily (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        scheduleDayId BIGINT NOT NULL,
        userId BIGINT NOT NULL,
        engagementId BIGINT,
        status ENUM('present','absent','late','leave','exception') NOT NULL,
        actualHours INT DEFAULT 0,
        paidFlag BOOLEAN NOT NULL DEFAULT FALSE,
        overtimeHours INT DEFAULT 0,
        comment VARCHAR(255),
        confirmedBy BIGINT NOT NULL,
        confirmedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_att_user(scheduleDayId, userId),
        FOREIGN KEY (scheduleDayId) REFERENCES schedule_days(id),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (engagementId) REFERENCES engagements(id),
        FOREIGN KEY (confirmedBy) REFERENCES users(id)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS hours_ledger (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        userId BIGINT NOT NULL,
        date DATETIME NOT NULL,
        hoursDelta INT NOT NULL,
        reason ENUM('attendance','manual_adjust','appeal_resolve') NOT NULL,
        refId BIGINT,
        createdBy BIGINT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (createdBy) REFERENCES users(id)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS point_ledger (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        userId BIGINT NOT NULL,
        pointsDelta INT NOT NULL,
        reason ENUM('attendance_eval','redeem','dept_bonus','manual_adjust','appeal_resolve') NOT NULL,
        refId BIGINT,
        departmentId BIGINT,
        createdBy BIGINT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (departmentId) REFERENCES departments(id),
        FOREIGN KEY (createdBy) REFERENCES users(id)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS dept_month_quota (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        departmentId BIGINT NOT NULL,
        yearMonth CHAR(7) NOT NULL,
        quotaPoints INT NOT NULL,
        approvedBy BIGINT NOT NULL,
        approvedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_dept_month(departmentId, yearMonth),
        FOREIGN KEY (departmentId) REFERENCES departments(id),
        FOREIGN KEY (approvedBy) REFERENCES users(id)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS dept_bonus_requests (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        departmentId BIGINT NOT NULL,
        yearMonth CHAR(7) NOT NULL,
        userId BIGINT NOT NULL,
        points INT NOT NULL,
        reasonText VARCHAR(255),
        status ENUM('pending','manager_approved','admin_approved','rejected') NOT NULL DEFAULT 'pending',
        createdBy BIGINT NOT NULL,
        updatedBy BIGINT NOT NULL,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (departmentId) REFERENCES departments(id),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (createdBy) REFERENCES users(id)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS user_rank_snapshot (
        userId BIGINT PRIMARY KEY,
        totalHours INT NOT NULL DEFAULT 0,
        totalPoints BIGINT NOT NULL DEFAULT 0,
        rankLevel INT NOT NULL DEFAULT 1,
        joyBadge BOOLEAN NOT NULL DEFAULT FALSE,
        joyGrantedAt DATETIME,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS rewards (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(128) NOT NULL,
        description VARCHAR(512),
        imageUrl VARCHAR(255),
        pointsCost INT NOT NULL,
        minLevelRequired INT NOT NULL DEFAULT 1,
        requireJoyBadge BOOLEAN NOT NULL DEFAULT FALSE,
        stock INT,
        status ENUM('active','inactive') NOT NULL DEFAULT 'active',
        createdBy BIGINT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (createdBy) REFERENCES users(id)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS redeem_orders (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        userId BIGINT NOT NULL,
        rewardId BIGINT NOT NULL,
        pointsCost INT NOT NULL,
        codePayload VARCHAR(64) NOT NULL,
        codeQrSig VARCHAR(128) NOT NULL,
        expiresAt DATETIME,
        status ENUM('pending','used','canceled','expired') NOT NULL DEFAULT 'pending',
        usedBy BIGINT,
        usedAt DATETIME,
        departmentId BIGINT,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (rewardId) REFERENCES rewards(id),
        FOREIGN KEY (usedBy) REFERENCES users(id),
        FOREIGN KEY (departmentId) REFERENCES departments(id)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS payroll_cycles (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        yearMonth CHAR(7) NOT NULL,
        departmentId BIGINT,
        status ENUM('open','locked','approved','exported') NOT NULL DEFAULT 'open',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        approvedBy BIGINT,
        approvedAt DATETIME,
        UNIQUE KEY uk_payroll_month_dept(yearMonth, departmentId),
        FOREIGN KEY (departmentId) REFERENCES departments(id),
        FOREIGN KEY (approvedBy) REFERENCES users(id)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS payroll_items (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        payrollCycleId BIGINT NOT NULL,
        userId BIGINT NOT NULL,
        engagementId BIGINT NOT NULL,
        paidHours INT NOT NULL DEFAULT 0,
        hourlyRate INT,
        baseAmount INT NOT NULL DEFAULT 0,
        bonusAmount INT NOT NULL DEFAULT 0,
        deductionAmount INT NOT NULL DEFAULT 0,
        finalAmount INT NOT NULL DEFAULT 0,
        note VARCHAR(255),
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (payrollCycleId) REFERENCES payroll_cycles(id),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (engagementId) REFERENCES engagements(id),
        INDEX idx_payroll_user (userId, engagementId)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS audit_logs (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        actorUserId BIGINT NOT NULL,
        action VARCHAR(64) NOT NULL,
        targetTable VARCHAR(64),
        targetId BIGINT,
        detailJson JSON,
        ip VARCHAR(64),
        ua VARCHAR(255),
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (actorUserId) REFERENCES users(id)
      ) ENGINE=InnoDB`,
    ];

    for (const sql of tables) {
      await connection.execute(sql);
    }

    console.log("✓ All tables created successfully");
  } catch (error) {
    console.error("Failed to create tables:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

createAllTables()
  .then(() => {
    console.log("Table creation complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Table creation failed:", error);
    process.exit(1);
  });
