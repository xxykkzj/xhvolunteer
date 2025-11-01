import { getDb } from "../db";
import { auditLogs } from "../../drizzle/schema";

/**
 * Audit logging service for tracking all important operations
 */

export type AuditAction =
  | "user_login"
  | "user_register"
  | "user_role_change"
  | "engagement_create"
  | "engagement_update"
  | "schedule_create"
  | "schedule_update"
  | "attendance_confirm"
  | "points_award"
  | "points_deduct"
  | "bonus_request_create"
  | "bonus_request_approve"
  | "bonus_request_reject"
  | "reward_create"
  | "reward_update"
  | "reward_delete"
  | "redemption_create"
  | "redemption_verify"
  | "payroll_create"
  | "payroll_approve"
  | "department_create"
  | "department_update"
  | "quota_set"
  | "manual_adjustment";

export interface AuditLogEntry {
  userId: number;
  action: AuditAction;
  targetType?: string;
  targetId?: number;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Audit] Database not available, skipping audit log");
    return;
  }

  try {
    await db.insert(auditLogs).values({
      actorUserId: entry.userId,
      action: entry.action,
      targetTable: entry.targetType || null,
      targetId: entry.targetId || null,
      detailJson: entry.details || null,
      ip: entry.ipAddress || null,
      ua: entry.userAgent || null,
    });
  } catch (error) {
    console.error("[Audit] Failed to log audit event:", error);
    // Don't throw - audit logging should not break the main operation
  }
}

/**
 * Log user authentication
 */
export async function logUserLogin(userId: number, ipAddress?: string, userAgent?: string): Promise<void> {
  await logAudit({
    userId,
    action: "user_login",
    ipAddress,
    userAgent,
  });
}

/**
 * Log user registration
 */
export async function logUserRegister(userId: number, details?: Record<string, any>): Promise<void> {
  await logAudit({
    userId,
    action: "user_register",
    targetType: "user",
    targetId: userId,
    details,
  });
}

/**
 * Log role change
 */
export async function logRoleChange(
  adminId: number,
  targetUserId: number,
  oldRole: string,
  newRole: string
): Promise<void> {
  await logAudit({
    userId: adminId,
    action: "user_role_change",
    targetType: "user",
    targetId: targetUserId,
    details: { oldRole, newRole },
  });
}

/**
 * Log attendance confirmation
 */
export async function logAttendanceConfirm(
  confirmerId: number,
  attendanceId: number,
  details: Record<string, any>
): Promise<void> {
  await logAudit({
    userId: confirmerId,
    action: "attendance_confirm",
    targetType: "attendance",
    targetId: attendanceId,
    details,
  });
}

/**
 * Log points transaction
 */
export async function logPointsTransaction(
  userId: number,
  targetUserId: number,
  pointsDelta: number,
  reason: string
): Promise<void> {
  await logAudit({
    userId,
    action: pointsDelta > 0 ? "points_award" : "points_deduct",
    targetType: "user",
    targetId: targetUserId,
    details: { pointsDelta, reason },
  });
}

/**
 * Log bonus request creation
 */
export async function logBonusRequestCreate(
  managerId: number,
  requestId: number,
  details: Record<string, any>
): Promise<void> {
  await logAudit({
    userId: managerId,
    action: "bonus_request_create",
    targetType: "bonus_request",
    targetId: requestId,
    details,
  });
}

/**
 * Log bonus request approval/rejection
 */
export async function logBonusRequestDecision(
  adminId: number,
  requestId: number,
  approved: boolean,
  details?: Record<string, any>
): Promise<void> {
  await logAudit({
    userId: adminId,
    action: approved ? "bonus_request_approve" : "bonus_request_reject",
    targetType: "bonus_request",
    targetId: requestId,
    details,
  });
}

/**
 * Log reward management
 */
export async function logRewardManagement(
  adminId: number,
  action: "reward_create" | "reward_update" | "reward_delete",
  rewardId: number,
  details?: Record<string, any>
): Promise<void> {
  await logAudit({
    userId: adminId,
    action,
    targetType: "reward",
    targetId: rewardId,
    details,
  });
}

/**
 * Log redemption
 */
export async function logRedemption(
  userId: number,
  orderId: number,
  rewardId: number,
  pointsCost: number
): Promise<void> {
  await logAudit({
    userId,
    action: "redemption_create",
    targetType: "redeem_order",
    targetId: orderId,
    details: { rewardId, pointsCost },
  });
}

/**
 * Log redemption verification
 */
export async function logRedemptionVerify(
  verifierId: number,
  orderId: number,
  code: string
): Promise<void> {
  await logAudit({
    userId: verifierId,
    action: "redemption_verify",
    targetType: "redeem_order",
    targetId: orderId,
    details: { code },
  });
}

/**
 * Log department management
 */
export async function logDepartmentManagement(
  userId: number,
  action: "department_create" | "department_update",
  departmentId: number,
  details?: Record<string, any>
): Promise<void> {
  await logAudit({
    userId,
    action,
    targetType: "department",
    targetId: departmentId,
    details,
  });
}

/**
 * Log quota setting
 */
export async function logQuotaSet(
  adminId: number,
  departmentId: number,
  yearMonth: string,
  quotaPoints: number
): Promise<void> {
  await logAudit({
    userId: adminId,
    action: "quota_set",
    targetType: "department",
    targetId: departmentId,
    details: { yearMonth, quotaPoints },
  });
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(filters: {
  userId?: number;
  action?: AuditAction;
  targetType?: string;
  targetId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Build query dynamically based on filters
  // This is a simplified version - in production, use proper query builder
  let query = db.select().from(auditLogs);

  // Apply filters (simplified - you'd use proper WHERE clauses)
  const results = await query.limit(filters.limit || 100);

  return results;
}
