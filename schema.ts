import {
  bigint,
  boolean,
  datetime,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  unique,
  varchar,
  index,
} from "drizzle-orm/mysql-core";

/**
 * Core user table with role-based access control
 */
export const users = mysqlTable("users", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  unionId: varchar("unionId", { length: 64 }),  volunteerCode: varchar("volunteerCode", { length: 64 }),
  password: varchar("password", { length: 255 }), // Hashed password.unique(),
  name: varchar("name", { length: 64 }).notNull(),
  avatarUrl: varchar("avatarUrl", { length: 255 }),
  phone: varchar("phone", { length: 32 }),
  role: mysqlEnum("role", [
    "volunteer",
    "leader",
    "manager",
    "admin",
    "super-admin",
  ])
    .notNull()
    .default("volunteer"),
  status: mysqlEnum("status", ["active", "inactive", "banned"])
    .notNull()
    .default("active"),
  createdAt: datetime("createdAt", { mode: "date" }).notNull().$defaultFn(() => new Date()),
  updatedAt: datetime("updatedAt", { mode: "date" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

/**
 * Sensitive user information with encryption
 */
export const userSensitive = mysqlTable("user_sensitive", {
  userId: bigint("userId", { mode: "number" }).primaryKey(),
  idCardEncrypted: text("idCardEncrypted").notNull(), // Store as base64 string
  idCardLast4: varchar("idCardLast4", { length: 4 }).notNull(),
  emergencyContactName: varchar("emergencyContactName", { length: 64 }),
  emergencyContactPhone: varchar("emergencyContactPhone", { length: 32 }),
});

/**
 * Departments and organizational structure (hierarchical)
 * Supports 3-level hierarchy: 方丈助理 (level 1) → 中心 (level 2) → 部门 (level 3)
 * Employees can be assigned to any level, not just leaf nodes
 */
export const departments = mysqlTable("departments", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  parentId: bigint("parentId", { mode: "number" }), // null for root level (方丈助理)
  level: int("level").notNull().default(1), // 1=方丈助理, 2=中心, 3=部门
  fullPath: varchar("fullPath", { length: 255 }), // e.g., "方丈助理1/禅修中心/客堂"
  displayOrder: int("displayOrder").default(0), // For sorting within same parent
  createdAt: datetime("createdAt", { mode: "date" }).notNull().$defaultFn(() => new Date()),
  updatedAt: datetime("updatedAt", { mode: "date" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

/**
 * User-department relationships
 */
export const userDepartments = mysqlTable(
  "user_departments",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: bigint("userId", { mode: "number" }).notNull(),
    departmentId: bigint("departmentId", { mode: "number" }).notNull(),
    isPrimary: boolean("isPrimary").notNull().default(true),
  },
  (table) => ({
    uniqueUserDept: unique().on(table.userId, table.departmentId),
  })
);

/**
 * Service relationships: short-term volunteer or temple worker
 * Supports historical tracking: when engagement changes, old record is marked with effectiveUntil,
 * and new record is created with effectiveFrom. This enables time-based queries like
 * "how long has user been a temple worker" for badge eligibility.
 */
export const engagements = mysqlTable(
  "engagements",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: bigint("userId", { mode: "number" }).notNull(),
    type: mysqlEnum("type", ["volunteer_shortterm", "temple_worker"]).notNull(),
    departmentId: bigint("departmentId", { mode: "number" }).notNull(),
    title: varchar("title", { length: 64 }),
    startDate: datetime("startDate").notNull(),
    endDate: datetime("endDate"),
    
    // Historical tracking fields
    effectiveFrom: datetime("effectiveFrom").notNull().$defaultFn(() => new Date()), // When this record became effective
    effectiveUntil: datetime("effectiveUntil"), // null = currently effective, non-null = historical record
    replacedBy: bigint("replacedBy", { mode: "number" }), // ID of the engagement that replaced this one
    changeReason: varchar("changeReason", { length: 255 }), // Why this engagement was updated/terminated
    
    // Payroll fields (managed by finance department, not this system)
    hourlyRate: int("hourlyRate").default(0), // Store as cents
    salaryScheme: mysqlEnum("salaryScheme", ["hourly", "fixed", "none"])
      .notNull()
      .default("none"),
    fixedMonthly: int("fixedMonthly").default(0), // Store as cents
    allowPointsOnPaidHours: boolean("allowPointsOnPaidHours").notNull().default(true), // Both volunteers and temple workers earn points
    
    status: mysqlEnum("status", ["active", "inactive", "suspended"])
      .notNull()
      .default("active"),
    createdAt: datetime("createdAt", { mode: "date" }).notNull().$defaultFn(() => new Date()),
    updatedAt: datetime("updatedAt", { mode: "date" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
  },
  (table) => ({
    idxEngagementUser: index("idx_engagement_user").on(table.userId, table.status),
    idxEngagementDept: index("idx_engagement_dept").on(table.departmentId, table.status),
    idxEngagementEffective: index("idx_engagement_effective").on(table.userId, table.effectiveUntil), // For querying current engagement
  })
);

/**
 * Daily schedules by department
 */
export const scheduleDays = mysqlTable(
  "schedule_days",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    theDate: datetime("theDate").notNull(),
    departmentId: bigint("departmentId", { mode: "number" }).notNull(),
    shiftStart: varchar("shiftStart", { length: 8 }),
    shiftEnd: varchar("shiftEnd", { length: 8 }),
    requiredCount: int("requiredCount").default(1),
    note: varchar("note", { length: 255 }),
  },
  (table) => ({
    uniqueDeptDate: unique().on(table.departmentId, table.theDate),
  })
);

/**
 * Schedule assignments for specific users
 */
export const scheduleAssignments = mysqlTable(
  "schedule_assignments",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    scheduleDayId: bigint("scheduleDayId", { mode: "number" }).notNull(),
    userId: bigint("userId", { mode: "number" }).notNull(),
    plannedHours: int("plannedHours").default(0), // Store as minutes
    roleOnDuty: mysqlEnum("roleOnDuty", ["volunteer", "leader"]).default("volunteer"),
    engagementId: bigint("engagementId", { mode: "number" }),
  },
  (table) => ({
    uniqueSchedUser: unique().on(table.scheduleDayId, table.userId),
  })
);

/**
 * Weekly rotation rules for temple workers
 */
export const rotaRules = mysqlTable(
  "rota_rules",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    engagementId: bigint("engagementId", { mode: "number" }).notNull(),
    weekday: int("weekday").notNull(), // 1-7 (Monday-Sunday)
    startTime: varchar("startTime", { length: 8 }).notNull(), // HH:MM:SS
    endTime: varchar("endTime", { length: 8 }).notNull(),
    effectiveFrom: datetime("effectiveFrom").notNull(),
    effectiveTo: datetime("effectiveTo"),
  },
  (table) => ({
    idxRotaEngagement: index("idx_rota_engagement").on(table.engagementId, table.weekday),
  })
);

/**
 * Daily attendance confirmation
 */
export const attendanceDaily = mysqlTable(
  "attendance_daily",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    scheduleDayId: bigint("scheduleDayId", { mode: "number" }).notNull(),
    userId: bigint("userId", { mode: "number" }).notNull(),
    engagementId: bigint("engagementId", { mode: "number" }),
    status: mysqlEnum("status", ["present", "absent", "late", "leave", "exception"]).notNull(),
    actualHours: int("actualHours").default(0), // Store as minutes
    paidFlag: boolean("paidFlag").notNull().default(false),
    overtimeHours: int("overtimeHours").default(0), // Store as minutes
    comment: varchar("comment", { length: 255 }),
    confirmedBy: bigint("confirmedBy", { mode: "number" }).notNull(),
    confirmedAt: datetime("confirmedAt", { mode: "date" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => ({
    uniqueAttUser: unique().on(table.scheduleDayId, table.userId),
  })
);

/**
 * Service hours transaction ledger
 */
export const hoursLedger = mysqlTable("hours_ledger", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  date: datetime("date").notNull(),
  hoursDelta: int("hoursDelta").notNull(), // Store as minutes
  reason: mysqlEnum("reason", ["attendance", "manual_adjust", "appeal_resolve"]).notNull(),
  refId: bigint("refId", { mode: "number" }),
  createdBy: bigint("createdBy", { mode: "number" }).notNull(),
  createdAt: datetime("createdAt", { mode: "date" }).notNull().$defaultFn(() => new Date()),
});

/**
 * Points transaction ledger
 */
export const pointLedger = mysqlTable("point_ledger", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  pointsDelta: int("pointsDelta").notNull(),
  reason: mysqlEnum("reason", [
    "attendance_eval",
    "redeem",
    "dept_bonus",
    "manual_adjust",
    "appeal_resolve",
  ]).notNull(),
  refId: bigint("refId", { mode: "number" }),
  departmentId: bigint("departmentId", { mode: "number" }),
  createdBy: bigint("createdBy", { mode: "number" }).notNull(),
  createdAt: datetime("createdAt", { mode: "date" }).notNull().$defaultFn(() => new Date()),
});

/**
 * Department monthly quota for bonus points
 */
export const deptMonthQuota = mysqlTable(
  "dept_month_quota",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    departmentId: bigint("departmentId", { mode: "number" }).notNull(),
    yearMonth: varchar("yearMonth", { length: 7 }).notNull(), // YYYY-MM
    quotaPoints: int("quotaPoints").notNull(),
    approvedBy: bigint("approvedBy", { mode: "number" }).notNull(),
    approvedAt: datetime("approvedAt", { mode: "date" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => ({
    uniqueDeptMonth: unique().on(table.departmentId, table.yearMonth),
  })
);

/**
 * Department bonus requests with approval workflow
 */
export const deptBonusRequests = mysqlTable("dept_bonus_requests", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  departmentId: bigint("departmentId", { mode: "number" }).notNull(),
  yearMonth: varchar("yearMonth", { length: 7 }).notNull(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  points: int("points").notNull(),
  reasonText: varchar("reasonText", { length: 255 }),
  status: mysqlEnum("status", [
    "pending",
    "manager_approved",
    "admin_approved",
    "rejected",
  ])
    .notNull()
    .default("pending"),
  createdBy: bigint("createdBy", { mode: "number" }).notNull(),
  updatedBy: bigint("updatedBy", { mode: "number" }).notNull(),
  updatedAt: datetime("updatedAt", { mode: "date" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

/**
 * User rank snapshot with 7 levels and joy badge
 */
export const userRankSnapshot = mysqlTable("user_rank_snapshot", {
  userId: bigint("userId", { mode: "number" }).primaryKey(),
  totalHours: int("totalHours").notNull().default(0), // Store as minutes
  totalPoints: int("totalPoints").notNull().default(0),
  rankLevel: int("rankLevel").notNull().default(1), // 1-7
  joyBadge: boolean("joyBadge").notNull().default(false),
  joyGrantedAt: datetime("joyGrantedAt"),
  updatedAt: datetime("updatedAt", { mode: "date" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

/**
 * Badge definitions
 * Badges are used for eligibility verification (e.g., "temple worker for 1 year" badge required for certain rewards)
 */
export const badges = mysqlTable("badges", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(), // e.g., "joy_badge", "temple_worker_1year"
  name: varchar("name", { length: 128 }).notNull(), // Display name
  description: text("description"), // Detailed description
  iconUrl: varchar("iconUrl", { length: 255 }), // Badge icon image
  category: mysqlEnum("category", [
    "service_hours", // Based on cumulative service hours
    "engagement_duration", // Based on engagement duration (e.g., temple worker for X years)
    "special", // Manually granted special badges
  ]).notNull(),
  autoGrantRule: json("autoGrantRule"), // JSON rules for automatic granting, e.g., {"type": "engagement_duration", "engagementType": "temple_worker", "durationMonths": 12}
  displayOrder: int("displayOrder").default(0), // For sorting in UI
  status: mysqlEnum("status", ["active", "inactive"]).notNull().default("active"),
  createdAt: datetime("createdAt", { mode: "date" }).notNull().$defaultFn(() => new Date()),
  updatedAt: datetime("updatedAt", { mode: "date" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

/**
 * User badge records
 * Tracks which badges each user has earned, when, and by whom (auto or manual)
 */
export const userBadges = mysqlTable(
  "user_badges",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: bigint("userId", { mode: "number" }).notNull(),
    badgeId: bigint("badgeId", { mode: "number" }).notNull(),
    grantedAt: datetime("grantedAt", { mode: "date" }).notNull().$defaultFn(() => new Date()),
    grantedBy: bigint("grantedBy", { mode: "number" }), // null = auto-granted
    expiresAt: datetime("expiresAt"), // null = permanent
    metadata: json("metadata"), // Additional info, e.g., {"engagementId": 123, "durationMonths": 12}
    revokedAt: datetime("revokedAt"), // null = active, non-null = revoked
    revokedBy: bigint("revokedBy", { mode: "number" }),
    revokeReason: varchar("revokeReason", { length: 255 }),
  },
  (table) => ({
    uniqueUserBadge: unique().on(table.userId, table.badgeId),
    idxUserBadges: index("idx_user_badges").on(table.userId, table.revokedAt),
  })
);

/**
 * Rewards catalog
 */
export const rewards = mysqlTable("rewards", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  title: varchar("title", { length: 128 }).notNull(),
  description: varchar("description", { length: 512 }),
  imageUrl: varchar("imageUrl", { length: 255 }),
  pointsCost: int("pointsCost").notNull(),
  minLevelRequired: int("minLevelRequired").notNull().default(1), // 1-7
  requireJoyBadge: boolean("requireJoyBadge").notNull().default(false), // Legacy field, kept for backward compatibility
  requiredBadges: json("requiredBadges"), // Array of badge codes required for redemption, e.g., ["joy_badge", "temple_worker_1year"]
  stock: int("stock"), // -1 for unlimited
  status: mysqlEnum("status", ["active", "inactive"]).notNull().default("active"),
  createdBy: bigint("createdBy", { mode: "number" }).notNull(),
  createdAt: datetime("createdAt", { mode: "date" }).notNull().$defaultFn(() => new Date()),
});

/**
 * Redemption orders with verification codes
 */
export const redeemOrders = mysqlTable("redeem_orders", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  rewardId: bigint("rewardId", { mode: "number" }).notNull(),
  pointsCost: int("pointsCost").notNull(),
  codePayload: varchar("codePayload", { length: 64 }).notNull(),
  codeQrSig: varchar("codeQrSig", { length: 128 }).notNull(),
  expiresAt: datetime("expiresAt"),
  status: mysqlEnum("status", ["pending", "used", "canceled", "expired"])
    .notNull()
    .default("pending"),
  usedBy: bigint("usedBy", { mode: "number" }),
  usedAt: datetime("usedAt"),
  departmentId: bigint("departmentId", { mode: "number" }),
  createdAt: datetime("createdAt", { mode: "date" }).notNull().$defaultFn(() => new Date()),
});

/**
 * Payroll cycles for temple workers
 *
 * ⚠️ INTENTIONALLY NOT IMPLEMENTED
 * These tables are defined but not used in the application.
 * Temple worker compensation is managed separately by the financial department.
 * The volunteer management system focuses on service tracking and recognition only.
 *
 * These tables are retained in the schema for potential future use if requirements change.
 */
export const payrollCycles = mysqlTable(
  "payroll_cycles",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    yearMonth: varchar("yearMonth", { length: 7 }).notNull(),
    departmentId: bigint("departmentId", { mode: "number" }),
    status: mysqlEnum("status", ["open", "locked", "approved", "exported"])
      .notNull()
      .default("open"),
    createdAt: datetime("createdAt", { mode: "date" }).notNull().$defaultFn(() => new Date()),
    approvedBy: bigint("approvedBy", { mode: "number" }),
    approvedAt: datetime("approvedAt"),
  },
  (table) => ({
    uniquePayrollMonthDept: unique().on(table.yearMonth, table.departmentId),
  })
);

/**
 * Payroll items for individual temple workers
 *
 * ⚠️ INTENTIONALLY NOT IMPLEMENTED
 * See comment on payrollCycles table above.
 */
export const payrollItems = mysqlTable(
  "payroll_items",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    payrollCycleId: bigint("payrollCycleId", { mode: "number" }).notNull(),
    userId: bigint("userId", { mode: "number" }).notNull(),
    engagementId: bigint("engagementId", { mode: "number" }).notNull(),
    paidHours: int("paidHours").notNull().default(0), // Store as minutes
    hourlyRate: int("hourlyRate"), // Store as cents
    baseAmount: int("baseAmount").notNull().default(0), // Store as cents
    bonusAmount: int("bonusAmount").notNull().default(0), // Store as cents
    deductionAmount: int("deductionAmount").notNull().default(0), // Store as cents
    finalAmount: int("finalAmount").notNull().default(0), // Store as cents
    note: varchar("note", { length: 255 }),
    createdAt: datetime("createdAt", { mode: "date" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => ({
    idxPayrollUser: index("idx_payroll_user").on(table.userId, table.engagementId),
  })
);

/**
 * Audit log for security and compliance
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  actorUserId: bigint("actorUserId", { mode: "number" }).notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  targetTable: varchar("targetTable", { length: 64 }),
  targetId: bigint("targetId", { mode: "number" }),
  detailJson: json("detailJson"),
  ip: varchar("ip", { length: 64 }),
  ua: varchar("ua", { length: 255 }),
  createdAt: datetime("createdAt", { mode: "date" }).notNull().$defaultFn(() => new Date()),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type UserSensitive = typeof userSensitive.$inferSelect;
export type InsertUserSensitive = typeof userSensitive.$inferInsert;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

export type UserDepartment = typeof userDepartments.$inferSelect;
export type InsertUserDepartment = typeof userDepartments.$inferInsert;

export type Engagement = typeof engagements.$inferSelect;
export type InsertEngagement = typeof engagements.$inferInsert;

export type ScheduleDay = typeof scheduleDays.$inferSelect;
export type InsertScheduleDay = typeof scheduleDays.$inferInsert;

export type ScheduleAssignment = typeof scheduleAssignments.$inferSelect;
export type InsertScheduleAssignment = typeof scheduleAssignments.$inferInsert;

export type RotaRule = typeof rotaRules.$inferSelect;
export type InsertRotaRule = typeof rotaRules.$inferInsert;

export type AttendanceDaily = typeof attendanceDaily.$inferSelect;
export type InsertAttendanceDaily = typeof attendanceDaily.$inferInsert;

export type HoursLedger = typeof hoursLedger.$inferSelect;
export type InsertHoursLedger = typeof hoursLedger.$inferInsert;

export type PointLedger = typeof pointLedger.$inferSelect;
export type InsertPointLedger = typeof pointLedger.$inferInsert;

export type DeptMonthQuota = typeof deptMonthQuota.$inferSelect;
export type InsertDeptMonthQuota = typeof deptMonthQuota.$inferInsert;

export type DeptBonusRequest = typeof deptBonusRequests.$inferSelect;
export type InsertDeptBonusRequest = typeof deptBonusRequests.$inferInsert;

export type UserRankSnapshot = typeof userRankSnapshot.$inferSelect;
export type InsertUserRankSnapshot = typeof userRankSnapshot.$inferInsert;

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = typeof rewards.$inferInsert;

export type RedeemOrder = typeof redeemOrders.$inferSelect;
export type InsertRedeemOrder = typeof redeemOrders.$inferInsert;

export type PayrollCycle = typeof payrollCycles.$inferSelect;
export type InsertPayrollCycle = typeof payrollCycles.$inferInsert;

export type PayrollItem = typeof payrollItems.$inferSelect;
export type InsertPayrollItem = typeof payrollItems.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
