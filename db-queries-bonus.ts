import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import {
  deptBonusRequests,
  deptMonthQuota,
  type InsertDeptBonusRequest,
  type InsertDeptMonthQuota,
} from "../drizzle/schema";

/**
 * Department bonus request queries
 */

export async function createBonusRequest(data: InsertDeptBonusRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(deptBonusRequests).values(data);
  return result;
}

export async function getBonusRequestById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(deptBonusRequests)
    .where(eq(deptBonusRequests.id, id))
    .limit(1);
  return result[0] || null;
}

export async function getBonusRequestsByDepartment(
  departmentId: number,
  yearMonth?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(deptBonusRequests.departmentId, departmentId)];
  if (yearMonth) {
    conditions.push(eq(deptBonusRequests.yearMonth, yearMonth));
  }

  return await db
    .select()
    .from(deptBonusRequests)
    .where(and(...conditions))
    .orderBy(desc(deptBonusRequests.updatedAt));
}

export async function getPendingBonusRequests() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(deptBonusRequests)
    .where(eq(deptBonusRequests.status, "pending"))
    .orderBy(desc(deptBonusRequests.updatedAt));
}

export async function updateBonusRequestStatus(
  requestId: number,
  status: "pending" | "manager_approved" | "admin_approved" | "rejected",
  updatedBy: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(deptBonusRequests)
    .set({ status, updatedBy })
    .where(eq(deptBonusRequests.id, requestId));
}

/**
 * Department quota queries
 */

export async function createDeptQuota(data: InsertDeptMonthQuota) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(deptMonthQuota).values(data);
  return result;
}

export async function getDeptQuota(departmentId: number, yearMonth: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(deptMonthQuota)
    .where(
      and(
        eq(deptMonthQuota.departmentId, departmentId),
        eq(deptMonthQuota.yearMonth, yearMonth)
      )
    )
    .limit(1);
  return result[0] || null;
}

export async function getApprovedBonusPointsForMonth(
  departmentId: number,
  yearMonth: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(deptBonusRequests)
    .where(
      and(
        eq(deptBonusRequests.departmentId, departmentId),
        eq(deptBonusRequests.yearMonth, yearMonth),
        eq(deptBonusRequests.status, "admin_approved")
      )
    );

  return result.reduce((sum, req) => sum + req.points, 0);
}
