import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../_core/trpc";
import * as dbQueries from "../../db-queries";
import { hasRoleLevel } from "../../../shared/constants";

// Helper to check role permissions
const requireRole = (
  userRole: "volunteer" | "leader" | "manager" | "admin" | "super-admin",
  requiredRole: "volunteer" | "leader" | "manager" | "admin" | "super-admin"
) => {
  if (!hasRoleLevel(userRole, requiredRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Requires ${requiredRole} role or higher`,
    });
  }
};

export const badgesRouter = router({
  // Get all active badges
  list: protectedProcedure.query(async () => {
    return await dbQueries.getAllBadges();
  }),

  // Get user's badges
  myBadges: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return await dbQueries.getUserBadges(ctx.user.id);
  }),

  // Get another user's badges (admin/manager only)
  userBadges: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input, ctx }) => {
      requireRole(ctx.user.role, "manager");
      return await dbQueries.getUserBadges(input.userId);
    }),

  // Manually grant badge (admin only)
  grant: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        badgeCode: z.string(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requireRole(ctx.user.role, "admin");

      // Get badge by code
      const badge = await dbQueries.getBadgeByCode(input.badgeCode);
      if (!badge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Badge not found",
        });
      }

      // Check if user already has this badge
      const userBadges = await dbQueries.getUserBadges(input.userId);
      const hasBadge = userBadges.some((ub) => ub.badge?.code === input.badgeCode);
      if (hasBadge) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User already has this badge",
        });
      }

      // Grant badge
      await dbQueries.grantBadge({
        userId: input.userId,
        badgeId: badge.id,
        grantedBy: ctx.user.id,
        metadata: input.metadata,
      });

      return { success: true };
    }),

  // Revoke badge (admin only)
  revoke: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        badgeId: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requireRole(ctx.user.role, "admin");

      await dbQueries.revokeBadge(
        input.userId,
        input.badgeId,
        ctx.user.id,
        input.reason
      );

      return { success: true };
    }),
});
