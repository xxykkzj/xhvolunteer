/**
 * Shared constants for the volunteer management system
 */

// Joy badge threshold: 70 hours (stored as minutes)
export const HOURS_JOY_BADGE_THRESHOLD = 70 * 60; // 4200 minutes

// Seven-level ranking system (十地菩萨前七地)
// Points are stored as integers, levels use left-closed right-open intervals [min, max)
export const LEVEL_RULES = [
  { level: 1, name: "欢喜地", nameEn: "Joyful Ground", min: 0, max: 100 },
  { level: 2, name: "离垢地", nameEn: "Stainless Ground", min: 100, max: 200 },
  { level: 3, name: "发光地", nameEn: "Luminous Ground", min: 200, max: 1000 },
  { level: 4, name: "焰慧地", nameEn: "Radiant Ground", min: 1000, max: 2000 },
  { level: 5, name: "难胜地", nameEn: "Invincible Ground", min: 2000, max: 6000 },
  { level: 6, name: "现前地", nameEn: "Manifest Ground", min: 6000, max: 10000 },
  { level: 7, name: "远行地", nameEn: "Far-Reaching Ground", min: 10000, max: Infinity },
] as const;

// Minimum service period for short-term volunteers (in days)
export const MIN_SHORTTERM_VOLUNTEER_DAYS = 14;

// Role hierarchy for permission checking
export const ROLE_HIERARCHY = {
  volunteer: 1,
  leader: 2,
  manager: 3,
  admin: 4,
  "super-admin": 5,
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

/**
 * Calculate rank level based on total points
 */
export function calculateRankLevel(totalPoints: number): number {
  for (const rule of LEVEL_RULES) {
    if (totalPoints >= rule.min && totalPoints < rule.max) {
      return rule.level;
    }
  }
  return 1; // Default to level 1
}

/**
 * Get level info by level number
 */
export function getLevelInfo(level: number) {
  return LEVEL_RULES.find((r) => r.level === level) || LEVEL_RULES[0];
}

/**
 * Check if user should receive joy badge
 */
export function shouldGrantJoyBadge(totalMinutes: number, currentJoyBadge: boolean): boolean {
  return totalMinutes >= HOURS_JOY_BADGE_THRESHOLD && !currentJoyBadge;
}

/**
 * Check if user has sufficient role level
 */
export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
