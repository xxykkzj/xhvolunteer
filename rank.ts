import { eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import {
  hoursLedger,
  pointLedger,
  userRankSnapshot,
  type InsertUserRankSnapshot,
} from "../../drizzle/schema";
import {
  calculateRankLevel,
  shouldGrantJoyBadge,
  HOURS_JOY_BADGE_THRESHOLD,
} from "../../shared/constants";

/**
 * Rank service for managing user levels and joy badges
 */

/**
 * Initialize rank snapshot for a new user
 */
export async function initializeUserRank(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(userRankSnapshot).values({
    userId,
    totalHours: 0,
    totalPoints: 0,
    rankLevel: 1,
    joyBadge: false,
    joyGrantedAt: null,
  });
}

/**
 * Update user rank snapshot based on ledger transactions
 * This should be called after any hours or points transaction
 */
export async function updateUserRankSnapshot(userId: number): Promise<{
  totalHours: number;
  totalPoints: number;
  rankLevel: number;
  joyBadge: boolean;
  joyGrantedAt: Date | null;
  joyBadgeJustGranted: boolean;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calculate total hours from hours_ledger
  const hoursResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(${hoursLedger.hoursDelta}), 0)`,
    })
    .from(hoursLedger)
    .where(eq(hoursLedger.userId, userId));

  const totalMinutes = hoursResult[0]?.total || 0;

  // Calculate total points from point_ledger
  const pointsResult = await db
    .select({
      total: sql<string>`COALESCE(SUM(${pointLedger.pointsDelta}), 0)`,
    })
    .from(pointLedger)
    .where(eq(pointLedger.userId, userId));

  const totalPoints = parseInt(pointsResult[0]?.total || "0", 10);

  // Calculate new rank level
  const newRankLevel = calculateRankLevel(totalPoints);

  // Check current snapshot
  const currentSnapshot = await db
    .select()
    .from(userRankSnapshot)
    .where(eq(userRankSnapshot.userId, userId))
    .limit(1);

  const currentJoyBadge = currentSnapshot[0]?.joyBadge || false;
  const shouldGrant = shouldGrantJoyBadge(totalMinutes, currentJoyBadge);

  let joyGrantedAt = currentSnapshot[0]?.joyGrantedAt || null;
  let joyBadgeJustGranted = false;

  if (shouldGrant) {
    joyGrantedAt = new Date();
    joyBadgeJustGranted = true;
  }

  // Upsert snapshot
  if (currentSnapshot.length === 0) {
    await db.insert(userRankSnapshot).values({
      userId,
      totalHours: totalMinutes,
      totalPoints: totalPoints,
      rankLevel: newRankLevel,
      joyBadge: shouldGrant,
      joyGrantedAt,
    });
  } else {
    await db
      .update(userRankSnapshot)
      .set({
        totalHours: totalMinutes,
        totalPoints: totalPoints,
        rankLevel: newRankLevel,
        joyBadge: shouldGrant || currentJoyBadge,
        joyGrantedAt: shouldGrant ? joyGrantedAt : currentSnapshot[0].joyGrantedAt,
      })
      .where(eq(userRankSnapshot.userId, userId));
  }

  return {
    totalHours: totalMinutes,
    totalPoints,
    rankLevel: newRankLevel,
    joyBadge: shouldGrant || currentJoyBadge,
    joyGrantedAt,
    joyBadgeJustGranted,
  };
}

/**
 * Get user rank snapshot
 */
export async function getUserRankSnapshot(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(userRankSnapshot)
    .where(eq(userRankSnapshot.userId, userId))
    .limit(1);

  return result[0] || null;
}

/**
 * Check if user can redeem a reward
 */
export async function canUserRedeemReward(
  userId: number,
  requiredLevel: number,
  requiredPoints: number,
  requireJoyBadge: boolean
): Promise<{ canRedeem: boolean; reason?: string }> {
  const snapshot = await getUserRankSnapshot(userId);

  if (!snapshot) {
    return { canRedeem: false, reason: "User rank not initialized" };
  }

  if (snapshot.rankLevel < requiredLevel) {
    return { canRedeem: false, reason: "Insufficient rank level" };
  }

  if (Number(snapshot.totalPoints) < requiredPoints) {
    return { canRedeem: false, reason: "Insufficient points" };
  }

  if (requireJoyBadge && !snapshot.joyBadge) {
    return { canRedeem: false, reason: "Joy badge required" };
  }

  return { canRedeem: true };
}

/**
 * Get joy badge threshold in hours for display
 */
export function getJoyBadgeThresholdHours(): number {
  return HOURS_JOY_BADGE_THRESHOLD / 60;
}
