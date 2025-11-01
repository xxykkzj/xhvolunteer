import { eq, desc, and, gte, lte, sql, isNull } from "drizzle-orm";
import { getDb } from "./db";
import {
  departments,
  userDepartments,
  engagements,
  scheduleDays,
  scheduleAssignments,
  rotaRules,
  attendanceDaily,
  hoursLedger,
  pointLedger,
  deptMonthQuota,
  deptBonusRequests,
  userRankSnapshot,
  rewards,
  redeemOrders,
  payrollCycles,
  payrollItems,
  auditLogs,
  users,
  userSensitive,
  badges,
  userBadges,
  type InsertDepartment,
  type InsertEngagement,
  type InsertScheduleDay,
  type InsertScheduleAssignment,
  type InsertAttendanceDaily,
  type InsertHoursLedger,
  type InsertPointLedger,
  type InsertReward,
  type InsertRedeemOrder,
  type InsertAuditLog,
  type InsertBadge,
  type InsertUserBadge,
} from "../drizzle/schema";

/**
 * Department queries
 */
export async function createDepartment(data: InsertDepartment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(departments).values(data);
  return result;
}

export async function getAllDepartments() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(departments).orderBy(departments.name);
}

export async function getDepartmentById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
  return result[0] || null;
}

/**
 * Engagement queries
 */
export async function createEngagement(data: InsertEngagement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(engagements).values(data);
  return result;
}

export async function getEngagementsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(engagements)
    .where(eq(engagements.userId, userId))
    .orderBy(desc(engagements.createdAt));
}

export async function getEngagementById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(engagements).where(eq(engagements.id, id)).limit(1);
  return result[0] || null;
}

/**
 * Schedule queries
 */
export async function createScheduleDay(data: InsertScheduleDay) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(scheduleDays).values(data);
  return result;
}

export async function getSchedulesByDateRange(departmentId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(scheduleDays)
    .where(
      and(
        eq(scheduleDays.departmentId, departmentId),
        gte(scheduleDays.theDate, startDate),
        lte(scheduleDays.theDate, endDate)
      )
    )
    .orderBy(scheduleDays.theDate);
}

/**
 * Attendance queries
 */
export async function createAttendance(data: InsertAttendanceDaily) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(attendanceDaily).values(data);
  return result;
}

export async function getAttendanceByScheduleDay(scheduleDayId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(attendanceDaily)
    .where(eq(attendanceDaily.scheduleDayId, scheduleDayId));
}

/**
 * Ledger queries
 */
export async function createHoursLedger(data: InsertHoursLedger) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(hoursLedger).values(data);
  return result;
}

export async function createPointLedger(data: InsertPointLedger) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(pointLedger).values(data);
  return result;
}

export async function getPointLedgerByUserId(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(pointLedger)
    .where(eq(pointLedger.userId, userId))
    .orderBy(desc(pointLedger.createdAt))
    .limit(limit);
}

export async function getHoursLedgerByUserId(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(hoursLedger)
    .where(eq(hoursLedger.userId, userId))
    .orderBy(desc(hoursLedger.createdAt))
    .limit(limit);
}

/**
 * Reward queries
 */
export async function createReward(data: InsertReward) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(rewards).values(data);
  return result;
}

export async function getAllActiveRewards() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(rewards)
    .where(eq(rewards.status, "active"))
    .orderBy(rewards.pointsCost);
}

export async function getRewardById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(rewards).where(eq(rewards.id, id)).limit(1);
  return result[0] || null;
}

export async function updateRewardStock(rewardId: number, delta: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(rewards)
    .set({ stock: sql`${rewards.stock} + ${delta}` })
    .where(eq(rewards.id, rewardId));
}

/**
 * Redemption queries
 */
export async function createRedeemOrder(data: InsertRedeemOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(redeemOrders).values(data);
  return result;
}

export async function getRedeemOrderById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(redeemOrders).where(eq(redeemOrders.id, id)).limit(1);
  return result[0] || null;
}

export async function getRedeemOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(redeemOrders)
    .where(eq(redeemOrders.userId, userId))
    .orderBy(desc(redeemOrders.createdAt));
}

export async function updateRedeemOrderStatus(
  orderId: number,
  status: "pending" | "used" | "canceled" | "expired",
  usedBy?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(redeemOrders)
    .set({
      status,
      usedBy: usedBy || null,
      usedAt: status === "used" ? new Date() : null,
    })
    .where(eq(redeemOrders.id, orderId));
}

/**
 * Audit log queries
 */
export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(auditLogs).values(data);
  return result;
}

export async function getAuditLogs(filters: {
  actorUserId?: number;
  targetTable?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db.select().from(auditLogs);

  const conditions = [];
  if (filters.actorUserId) {
    conditions.push(eq(auditLogs.actorUserId, filters.actorUserId));
  }
  if (filters.targetTable) {
    conditions.push(eq(auditLogs.targetTable, filters.targetTable));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return await query.orderBy(desc(auditLogs.createdAt)).limit(filters.limit || 100);
}

/**
 * User queries
 */
export async function getAllUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(users).orderBy(users.name);
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

export async function updateUserRole(
  userId: number,
  role: "volunteer" | "leader" | "manager" | "admin" | "super-admin"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

/**
 * Badge queries
 */
export async function getAllBadges() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(badges).where(eq(badges.status, "active")).orderBy(badges.displayOrder);
}

export async function getBadgeByCode(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(badges).where(eq(badges.code, code)).limit(1);
  return result[0] || null;
}

export async function getUserBadges(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select({
      userBadge: userBadges,
      badge: badges,
    })
    .from(userBadges)
    .leftJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(and(eq(userBadges.userId, userId), isNull(userBadges.revokedAt)));
}

export async function grantBadge(data: InsertUserBadge) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(userBadges).values(data);
  return result;
}

export async function revokeBadge(userId: number, badgeId: number, revokedBy: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(userBadges)
    .set({
      revokedAt: new Date(),
      revokedBy,
      revokeReason: reason,
    })
    .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)));
}

/**
 * Engagement queries with historical tracking
 */
export async function getCurrentEngagement(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(engagements)
    .where(and(eq(engagements.userId, userId), isNull(engagements.effectiveUntil)))
    .limit(1);
  return result[0] || null;
}

export async function getEngagementHistory(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(engagements)
    .where(eq(engagements.userId, userId))
    .orderBy(desc(engagements.effectiveFrom));
}

export async function updateEngagement(
  userId: number,
  newEngagementData: InsertEngagement,
  changeReason: string,
  updatedBy: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current engagement
  const current = await getCurrentEngagement(userId);

  if (current) {
    // Mark current engagement as ended
    await db
      .update(engagements)
      .set({
        effectiveUntil: new Date(),
      })
      .where(eq(engagements.id, current.id));
  }

  // Create new engagement record
  const result = await db.insert(engagements).values({
    ...newEngagementData,
    effectiveFrom: new Date(),
    effectiveUntil: null,
    replacedBy: null,
    changeReason,
  });

  return result;
}

/**
 * Department hierarchy queries
 */
export async function getDepartmentTree() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const allDepts = await db.select().from(departments).orderBy(departments.displayOrder);

  // Build tree structure
  const deptMap = new Map();
  const roots: any[] = [];

  allDepts.forEach((dept) => {
    deptMap.set(dept.id, { ...dept, children: [] });
  });

  allDepts.forEach((dept) => {
    const node = deptMap.get(dept.id);
    if (dept.parentId === null) {
      roots.push(node);
    } else {
      const parent = deptMap.get(dept.parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return roots;
}

export async function getDepartmentsByLevel(level: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(departments).where(eq(departments.level, level)).orderBy(departments.displayOrder);
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
