import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../_core/trpc";
import * as dbQueries from "../../db-queries";
import * as rankService from "../../services/rank";
import { hasRoleLevel } from "../../../shared/constants";
import * as passwordService from "../../services/password";
import { getDb } from "../../db";
import { users } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

// Helper to check admin permissions
const requireAdmin = (userRole: "volunteer" | "leader" | "manager" | "admin" | "super-admin") => {
  if (!hasRoleLevel(userRole, "admin")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Requires admin role",
    });
  }
};

export const adminRouter = router({
  // List all users (admin only)
  users: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const allUsers = await db.select().from(users);
      return allUsers;
    }),

    // Create new user (admin only)
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(64),
          phone: z.string().optional(),
          volunteerCode: z.string().min(1).max(32),
          birthday: z.date().optional(), // For generating initial password
          role: z.enum(["volunteer", "leader", "manager", "admin"]).default("volunteer"),
          // Initial engagement info
          engagementType: z.enum(["volunteer_shortterm", "temple_worker"]),
          departmentId: z.number(),
          engagementTitle: z.string().optional(),
          startDate: z.date(),
          endDate: z.date().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        requireAdmin(ctx.user.role);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Check if volunteerCode already exists
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.volunteerCode, input.volunteerCode))
          .limit(1);

        if (existing.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "志愿者编号已存在",
          });
        }

        // Generate initial password from birthday (yymmdd)
        const initialPassword = input.birthday
          ? passwordService.generateInitialPassword(input.birthday)
          : "123456"; // Fallback if no birthday provided
        const hashedPassword = await passwordService.hashPassword(initialPassword);

        // Create user with a placeholder openId (will be updated on first login)
        const result = await db.insert(users).values({
          openId: `volunteer_${input.volunteerCode}`, // Placeholder
          name: input.name,
          phone: input.phone,
          volunteerCode: input.volunteerCode,
          password: hashedPassword,
          role: input.role,
        });

        const userId = Number((result as any).insertId || 0);

        // Create initial engagement
        await dbQueries.createEngagement({
          userId,
          type: input.engagementType,
          departmentId: input.departmentId,
          title: input.engagementTitle,
          startDate: input.startDate,
          endDate: input.endDate,
          salaryScheme: "none",
          allowPointsOnPaidHours: true, // All users get points
        });

        // Initialize rank snapshot
        await rankService.initializeUserRank(userId);

        return { success: true, userId };
      }),

    // Update user (admin only)
    update: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          name: z.string().min(1).max(64).optional(),
          phone: z.string().optional(),
          role: z.enum(["volunteer", "leader", "manager", "admin"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        requireAdmin(ctx.user.role);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const { userId, ...updates } = input;
        await db.update(users).set(updates).where(eq(users.id, userId));

        return { success: true };
      }),
  }),
});
