import { getDb } from "../db";
import { badges, userBadges, userRankSnapshot } from "../../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import * as dbQueries from "../db-queries";

/**
 * Badge auto-grant service
 * Checks and grants badges based on predefined rules
 */

interface BadgeRule {
  badgeCode: string;
  check: (userId: number) => Promise<boolean>;
}

/**
 * Check if user meets service hours requirement
 */
async function checkServiceHours(userId: number, requiredHours: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const snapshot = await db
    .select()
    .from(userRankSnapshot)
    .where(eq(userRankSnapshot.userId, userId))
    .limit(1);

  if (snapshot.length === 0) return false;
  return snapshot[0].totalHours >= requiredHours;
}

/**
 * Check if user has been temple worker for required duration
 */
async function checkTempleWorkerDuration(userId: number, requiredMonths: number): Promise<boolean> {
  const engagements = await dbQueries.getEngagementHistory(userId);
  
  const templeWorkerEngagements = engagements.filter(
    (e: any) => e.type === "temple_worker" && e.effectiveFrom
  );

  if (templeWorkerEngagements.length === 0) return false;

  // Calculate total months as temple worker
  let totalMonths = 0;
  const now = new Date();

  for (const engagement of templeWorkerEngagements) {
    const start = engagement.effectiveFrom!;
    const end = engagement.effectiveUntil || now;
    const months = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
    totalMonths += months;
  }

  return totalMonths >= requiredMonths;
}

/**
 * Define all badge auto-grant rules
 */
const BADGE_RULES: BadgeRule[] = [
  {
    badgeCode: "joy_badge",
    check: (userId) => checkServiceHours(userId, 70),
  },
  {
    badgeCode: "temple_worker_1year",
    check: (userId) => checkTempleWorkerDuration(userId, 12),
  },
  {
    badgeCode: "hundred_hours",
    check: (userId) => checkServiceHours(userId, 100),
  },
  {
    badgeCode: "five_hundred_hours",
    check: (userId) => checkServiceHours(userId, 500),
  },
];

/**
 * Check and grant badges for a user based on rules
 * @param userId User ID to check
 * @returns Array of newly granted badge codes
 */
export async function checkAndGrantBadges(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const grantedBadges: string[] = [];

  for (const rule of BADGE_RULES) {
    // Check if user already has this badge
    const existingBadge = await db
      .select()
      .from(badges)
      .where(eq(badges.code, rule.badgeCode))
      .limit(1);

    if (existingBadge.length === 0) continue;

    const badgeId = existingBadge[0].id;

    const userHasBadge = await db
      .select()
      .from(userBadges)
      .where(
        and(
          eq(userBadges.userId, userId),
          eq(userBadges.badgeId, badgeId),
          isNull(userBadges.revokedAt)
        )
      )
      .limit(1);

    if (userHasBadge.length > 0) continue; // Already has badge

    // Check if user meets requirements
    const meetsRequirements = await rule.check(userId);

    if (meetsRequirements) {
      // Grant badge
      await dbQueries.grantBadge({
        userId,
        badgeId,
        grantedBy: null, // Auto-granted
        metadata: { autoGranted: true, rule: rule.badgeCode },
      });
      grantedBadges.push(rule.badgeCode);
    }
  }

  return grantedBadges;
}

/**
 * Check and grant badges for all active users
 * Can be run as a scheduled job
 */
export async function checkAndGrantBadgesForAllUsers(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Get all active users
  const { users } = await import("../../drizzle/schema");
  const allUsers = await db.select().from(users).where(eq(users.status, "active"));

  for (const user of allUsers) {
    try {
      await checkAndGrantBadges(user.id);
    } catch (error) {
      console.error(`Failed to check badges for user ${user.id}:`, error);
    }
  }
}
