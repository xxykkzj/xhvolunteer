import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../_core/trpc";
import * as dbQueries from "../../db-queries";
import * as badgeAutoGrant from "../../services/badgeAutoGrant";
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

export const engagementsRouter = router({
  // Get current user's engagement
  myCurrent: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return await dbQueries.getCurrentEngagement(ctx.user.id);
  }),

  // Get current user's engagement history
  myHistory: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return await dbQueries.getEngagementHistory(ctx.user.id);
  }),

  // Get another user's current engagement (manager+)
  userCurrent: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input, ctx }) => {
      requireRole(ctx.user.role, "manager");
      return await dbQueries.getCurrentEngagement(input.userId);
    }),

  // Get another user's engagement history (manager+)
  userHistory: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input, ctx }) => {
      requireRole(ctx.user.role, "manager");
      return await dbQueries.getEngagementHistory(input.userId);
    }),

  // Create or update engagement (admin only)
  update: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        type: z.enum(["volunteer_shortterm", "temple_worker"]),
        departmentId: z.number(),
        title: z.string().optional(),
        startDate: z.date(),
        endDate: z.date().optional(),
        changeReason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requireRole(ctx.user.role, "admin");

      const { changeReason, ...engagementData } = input;

      await dbQueries.updateEngagement(
        input.userId,
        engagementData,
        changeReason,
        ctx.user.id
      );
      
      // Check and grant badges based on engagement changes
      await badgeAutoGrant.checkAndGrantBadges(input.userId);

      return { success: true };
    }),
});
