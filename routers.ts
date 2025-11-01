import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { badgesRouter } from "./trpc/routers/badges";
import { engagementsRouter } from "./trpc/routers/engagements";
import { passwordRouter } from "./trpc/routers/password";
import { adminRouter } from "./trpc/routers/admin";
import { emailLoginRouter } from "./trpc/routers/emailLogin";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as dbQueries from "./db-queries";
import * as rankService from "./services/rank";
import * as badgeAutoGrant from "./services/badgeAutoGrant";
import { generateRedemptionCode, parseRedemptionCode } from "./services/signature";
import { MIN_SHORTTERM_VOLUNTEER_DAYS, hasRoleLevel, getLevelInfo } from "../shared/constants";
import { getDb } from "./db";
import {
  departments,
  engagements,
  users,
  scheduleDays,
  scheduleAssignments,
  attendanceDaily,
  hoursLedger,
  pointLedger,
} from "../drizzle/schema";

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

export const appRouter = router({
  system: systemRouter,
  badges: badgesRouter,
  engagements: engagementsRouter,
  password: passwordRouter,
  admin: adminRouter,
  emailLogin: emailLoginRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Department management
  departments: router({
    list: protectedProcedure.query(async () => {
      return await dbQueries.getAllDepartments();
    }),

    tree: protectedProcedure.query(async () => {
      return await dbQueries.getDepartmentTree();
    }),

    byLevel: protectedProcedure
      .input(z.object({ level: z.number().min(1).max(3) }))
      .query(async ({ input }) => {
        return await dbQueries.getDepartmentsByLevel(input.level);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(64),
          description: z.string().optional(),
          contactPerson: z.string().optional(),
          contactPhone: z.string().optional(),
          centerId: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        requireRole(ctx.user.role, "manager");
        await dbQueries.createDepartment(input);
        return { success: true };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(64).optional(),
          description: z.string().optional(),
          contactPerson: z.string().optional(),
          contactPhone: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        requireRole(ctx.user.role, "manager");
        const { id, ...updates } = input;
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(departments).set(updates).where(eq(departments.id, id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        requireRole(ctx.user.role, "manager");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.delete(departments).where(eq(departments.id, input.id));
        return { success: true };
      }),
  }),


  // Scheduling
  schedules: router({
    create: protectedProcedure
      .input(
        z.object({
          scheduleDate: z.string(),
          departmentId: z.number(),
          shiftStart: z.string(),
          shiftEnd: z.string(),
          requiredCount: z.number().default(1),
          note: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        requireRole(ctx.user.role, "leader");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const result = await db.insert(scheduleDays).values({
          theDate: new Date(input.scheduleDate),
          departmentId: input.departmentId,
          shiftStart: input.shiftStart,
          shiftEnd: input.shiftEnd,
          requiredCount: input.requiredCount,
          note: input.note,
        });
        return { success: true };
      }),

    list: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const schedulesList = await db
        .select({
          id: scheduleDays.id,
          scheduleDate: scheduleDays.theDate,
          departmentId: scheduleDays.departmentId,
          shiftStart: scheduleDays.shiftStart,
          shiftEnd: scheduleDays.shiftEnd,
          requiredCount: scheduleDays.requiredCount,
          note: scheduleDays.note,
          departmentName: departments.name,
        })
        .from(scheduleDays)
        .leftJoin(departments, eq(scheduleDays.departmentId, departments.id))
        .orderBy(desc(scheduleDays.theDate));

      // Get assignments for each schedule
      const schedulesWithAssignments = await Promise.all(
        schedulesList.map(async (schedule) => {
          const assignments = await db
            .select({
              id: scheduleAssignments.id,
              userId: scheduleAssignments.userId,
              userName: users.name,
              attended: attendanceDaily.id,
            })
            .from(scheduleAssignments)
            .leftJoin(users, eq(scheduleAssignments.userId, users.id))
            .leftJoin(
              attendanceDaily,
              eq(scheduleAssignments.scheduleDayId, attendanceDaily.scheduleDayId)
            )
            .where(eq(scheduleAssignments.scheduleDayId, schedule.id));

          return {
            ...schedule,
            assignments: assignments.map((a) => ({
              ...a,
              attended: !!a.attended,
            })),
          };
        })
      );

      return schedulesWithAssignments;
    }),

    assign: protectedProcedure
      .input(
        z.object({
          scheduleDayId: z.number(),
          userId: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        requireRole(ctx.user.role, "leader");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(scheduleAssignments).values({
          scheduleDayId: input.scheduleDayId,
          userId: input.userId,
        });
        return { success: true };
      }),

    confirmAttendance: protectedProcedure
      .input(
        z.object({
          scheduleDayId: z.number(),
          userId: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        requireRole(ctx.user.role, "leader");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Get assignment
        const assignment = await db
          .select()
          .from(scheduleAssignments)
          .where(
            eq(scheduleAssignments.scheduleDayId, input.scheduleDayId) &&
              eq(scheduleAssignments.userId, input.userId)
          )
          .limit(1);

        if (!assignment[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Assignment not found" });
        }

        // Get schedule details
        const schedule = await db
          .select()
          .from(scheduleDays)
          .where(eq(scheduleDays.id, input.scheduleDayId))
          .limit(1);

        if (!schedule[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Schedule not found" });
        }

        // Calculate hours
        const shiftStart = schedule[0].shiftStart || "09:00";
        const shiftEnd = schedule[0].shiftEnd || "17:00";
        const [startHour, startMin] = shiftStart.split(":").map(Number);
        const [endHour, endMin] = shiftEnd.split(":").map(Number);
        const hours = endHour - startHour + (endMin - startMin) / 60;

        // Record attendance
        const minutesWorked = Math.floor(hours * 60);
        await db.insert(attendanceDaily).values({
          scheduleDayId: input.scheduleDayId,
          userId: input.userId,
          status: "present",
          actualHours: minutesWorked,
          confirmedBy: ctx.user.id,
        });

        // Record hours (convert to minutes)
        const minutes = Math.floor(hours * 60);
        await db.insert(hoursLedger).values({
          userId: input.userId,
          date: schedule[0].theDate,
          hoursDelta: minutes,
          reason: "attendance",
          createdBy: ctx.user.id,
        });

        // Record points (1 hour = 10 points)
        const points = Math.floor(hours * 10);
        await db.insert(pointLedger).values({
          userId: input.userId,
          pointsDelta: points,
          reason: "attendance_eval",
          createdBy: ctx.user.id,
        });

        // Update rank snapshot
        await rankService.updateUserRankSnapshot(input.userId);
        
        // Check and grant badges based on new hours
        await badgeAutoGrant.checkAndGrantBadges(input.userId);

        return { success: true, hours, points };
      }),

    listByDateRange: protectedProcedure
      .input(
        z.object({
          departmentId: z.number(),
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ input }) => {
        return await dbQueries.getSchedulesByDateRange(
          input.departmentId,
          input.startDate,
          input.endDate
        );
      }),
  }),

  // Attendance confirmation
  attendance: router({
    confirm: protectedProcedure
      .input(
        z.object({
          scheduleDayId: z.number(),
          userId: z.number(),
          engagementId: z.number().optional(),
          status: z.enum(["present", "absent", "late", "leave", "exception"]),
          actualHours: z.number(), // in minutes
          paidFlag: z.boolean().default(false),
          overtimeHours: z.number().default(0),
          comment: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        requireRole(ctx.user.role, "leader");

        // Create attendance record
        await dbQueries.createAttendance({
          ...input,
          confirmedBy: ctx.user.id,
        });

        // Record hours if present
        if (input.status === "present" && input.actualHours > 0) {
          await dbQueries.createHoursLedger({
            userId: input.userId,
            date: new Date(),
            hoursDelta: input.actualHours,
            reason: "attendance",
            refId: input.scheduleDayId,
            createdBy: ctx.user.id,
          });

          // Record points if applicable (unpaid or allowed paid hours)
          if (!input.paidFlag || input.overtimeHours > 0) {
            const pointsToAward = Math.floor(input.actualHours / 60) * 10; // 10 points per hour
            if (pointsToAward > 0) {
              await dbQueries.createPointLedger({
                userId: input.userId,
                pointsDelta: pointsToAward,
                reason: "attendance_eval",
                refId: input.scheduleDayId,
                createdBy: ctx.user.id,
              });
            }
          }

          // Update rank snapshot and check for joy badge
          const updated = await rankService.updateUserRankSnapshot(input.userId);

          return {
            success: true,
            joyBadgeGranted: updated.joyBadgeJustGranted,
            newLevel: updated.rankLevel,
          };
        }

        return { success: true };
      }),
  }),

  // Points and ranking
  points: router({
    summary: protectedProcedure
      .input(z.object({ userId: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        const userId = input.userId || ctx.user.id;
        const snapshot = await rankService.getUserRankSnapshot(userId);

        if (!snapshot) {
          return {
            totalHours: 0,
            totalPoints: 0,
            rankLevel: 1,
            rankName: getLevelInfo(1).name,
            joyBadge: false,
            joyGrantedAt: null,
          };
        }

        return {
          totalHours: snapshot.totalHours,
          totalPoints: snapshot.totalPoints,
          rankLevel: snapshot.rankLevel,
          rankName: getLevelInfo(snapshot.rankLevel).name,
          joyBadge: snapshot.joyBadge,
          joyGrantedAt: snapshot.joyGrantedAt,
        };
      }),

    ledger: protectedProcedure
      .input(z.object({ userId: z.number().optional(), limit: z.number().default(50) }))
      .query(async ({ input, ctx }) => {
        const userId = input.userId || ctx.user.id;
        return await dbQueries.getPointLedgerByUserId(userId, input.limit);
      }),
  }),

  // Rewards
  rewards: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const allRewards = await dbQueries.getAllActiveRewards();
      const snapshot = await rankService.getUserRankSnapshot(ctx.user.id);
      const userBadges = await dbQueries.getUserBadges(ctx.user.id);
      const userBadgeCodes = userBadges.map((ub) => ub.badge?.code).filter(Boolean);

      return allRewards.map((reward) => {
        let canRedeem = false;
        let missingBadges: string[] = [];

        if (snapshot) {
          // Check basic requirements
          const meetsBasicReqs =
            snapshot.rankLevel >= reward.minLevelRequired &&
            snapshot.totalPoints >= reward.pointsCost &&
            (!reward.requireJoyBadge || snapshot.joyBadge);

          // Check badge requirements
          if (reward.requiredBadges && Array.isArray(reward.requiredBadges)) {
            const requiredBadgeCodes = reward.requiredBadges as string[];
            missingBadges = requiredBadgeCodes.filter(
              (code) => !userBadgeCodes.includes(code)
            );
            canRedeem = meetsBasicReqs && missingBadges.length === 0;
          } else {
            canRedeem = meetsBasicReqs;
          }
        }

        return {
          ...reward,
          canRedeem,
          locked: !canRedeem,
          missingBadges,
        };
      });
    }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(128),
          description: z.string().max(512).optional(),
          imageUrl: z.string().optional(),
          pointsCost: z.number().min(0),
          minLevelRequired: z.number().min(1).max(7),
          requireJoyBadge: z.boolean().default(false),
          stock: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        requireRole(ctx.user.role, "admin");
        await dbQueries.createReward({
          ...input,
          createdBy: ctx.user.id,
        });
        return { success: true };
      }),
  }),

  // Redemption
  redeem: router({
    create: protectedProcedure
      .input(z.object({ rewardId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const reward = await dbQueries.getRewardById(input.rewardId);
        if (!reward) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Reward not found" });
        }

        // Check eligibility
        const eligibility = await rankService.canUserRedeemReward(
          ctx.user.id,
          reward.minLevelRequired,
          reward.pointsCost,
          reward.requireJoyBadge
        );

        if (!eligibility.canRedeem) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: eligibility.reason || "Cannot redeem this reward",
          });
        }

        // Check stock
        if (reward.stock !== null && reward.stock !== -1 && reward.stock <= 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Out of stock" });
        }

        // Create redemption order
        const orderResult = await dbQueries.createRedeemOrder({
          userId: ctx.user.id,
          rewardId: reward.id,
          pointsCost: reward.pointsCost,
          codePayload: "",
          codeQrSig: "",
        });

        const orderId = Number((orderResult as any).insertId || 0);

        // Generate redemption code
        const { payload, signature, fullCode } = generateRedemptionCode(orderId, ctx.user.id);

        // Update order with code
        const db = await import("./db").then((m) => m.getDb());
        if (db) {
          const { redeemOrders } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          await db
            .update(redeemOrders)
            .set({ codePayload: payload, codeQrSig: signature })
            .where(eq(redeemOrders.id, orderId));
        }

        // Deduct points
        await dbQueries.createPointLedger({
          userId: ctx.user.id,
          pointsDelta: -reward.pointsCost,
          reason: "redeem",
          refId: orderId,
          createdBy: ctx.user.id,
        });

        // Update stock
        if (reward.stock !== null && reward.stock !== -1) {
          await dbQueries.updateRewardStock(reward.id, -1);
        }

        // Update rank snapshot
        await rankService.updateUserRankSnapshot(ctx.user.id);

        return {
          success: true,
          orderId,
          code: fullCode,
        };
      }),

    verify: protectedProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ input, ctx }) => {
        requireRole(ctx.user.role, "leader");

        const parsed = parseRedemptionCode(input.code);
        if (!parsed.valid) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid redemption code" });
        }

        if (parsed.expired) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Code has expired" });
        }

        const order = await dbQueries.getRedeemOrderById(parsed.orderId!);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }

        if (order.status !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Order already ${order.status}`,
          });
        }

        // Mark as used
        await dbQueries.updateRedeemOrderStatus(order.id, "used", ctx.user.id);

        return { success: true, order };
      }),

    myOrders: protectedProcedure.query(async ({ ctx }) => {
      return await dbQueries.getRedeemOrdersByUserId(ctx.user.id);
    }),
  }),

  // User management
  users: router({
    list: protectedProcedure
      .input(
        z.object({
          role: z.enum(["volunteer", "leader", "manager", "admin", "super-admin"]).optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, "manager");
        return await dbQueries.getAllUsers();
      }),

    getById: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Users can view their own profile, managers+ can view anyone
        if (ctx.user.id !== input.userId) {
          requireRole(ctx.user.role, "manager");
        }
        const user = await dbQueries.getUserById(input.userId);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        return user;
      }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          name: z.string().min(1).max(64).optional(),
          phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Users can update their own profile, managers+ can update anyone
        if (ctx.user.id !== input.userId) {
          requireRole(ctx.user.role, "manager");
        }
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const updateData: any = { updatedAt: new Date() };
        if (input.name) updateData.name = input.name;
        if (input.phone !== undefined) updateData.phone = input.phone;
        await db.update(users).set(updateData).where(eq(users.id, input.userId));
        return { success: true, message: "Profile updated successfully" };
      }),

    updateRole: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          role: z.enum(["volunteer", "leader", "manager", "admin", "super-admin"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        requireRole(ctx.user.role, "admin");
        // Cannot change own role
        if (ctx.user.id === input.userId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot change your own role" });
        }
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        // Get old role for audit log
        const userList = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
        if (userList.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        const oldRole = userList[0].role;
        await db.update(users).set({ role: input.role, updatedAt: new Date() }).where(eq(users.id, input.userId));
        // Log role change
        const { logRoleChange } = await import("./services/audit");
        await logRoleChange(ctx.user.id, input.userId, oldRole, input.role);
        return { success: true, message: "Role updated successfully" };
      }),

    delete: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, "admin");
        // Cannot delete own account
        if (ctx.user.id === input.userId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot delete your own account" });
        }
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(users).where(eq(users.id, input.userId));
        return { success: true, message: "User deleted successfully" };
      }),
  }),

  // Department bonus management
  bonus: router({
    // Create bonus request (Manager+)
    createRequest: protectedProcedure
      .input(
        z.object({
          departmentId: z.number(),
          yearMonth: z.string().regex(/^\d{4}-\d{2}$/), // Format: YYYY-MM
          userId: z.number(),
          points: z.number().min(1),
          reasonText: z.string().max(255),
        })
      )
      .mutation(async ({ input, ctx }) => {
        requireRole(ctx.user.role, "manager");

        const bonusQueries = await import("./db-queries-bonus");

        // Check if quota exists for this month
        const quota = await bonusQueries.getDeptQuota(input.departmentId, input.yearMonth);
        if (!quota) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No quota set for this department and month",
          });
        }

        // Check if adding this request would exceed quota
        const approvedPoints = await bonusQueries.getApprovedBonusPointsForMonth(
          input.departmentId,
          input.yearMonth
        );

        if (approvedPoints + input.points > quota.quotaPoints) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Request would exceed monthly quota. Available: ${
              quota.quotaPoints - approvedPoints
            } points`,
          });
        }

        await bonusQueries.createBonusRequest({
          ...input,
          status: "pending",
          createdBy: ctx.user.id,
          updatedBy: ctx.user.id,
        });

        return { success: true };
      }),

    // List bonus requests
    list: protectedProcedure
      .input(
        z.object({
          departmentId: z.number().optional(),
          yearMonth: z.string().optional(),
          status: z.enum(["pending", "manager_approved", "admin_approved", "rejected"]).optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        requireRole(ctx.user.role, "manager");

        const bonusQueries = await import("./db-queries-bonus");

        if (input.departmentId) {
          return await bonusQueries.getBonusRequestsByDepartment(
            input.departmentId,
            input.yearMonth
          );
        }

        // Admin can see all pending requests
        if (ctx.user.role === "admin" || ctx.user.role === "super-admin") {
          return await bonusQueries.getPendingBonusRequests();
        }

        return [];
      }),

    // Approve bonus request (Admin+)
    approve: protectedProcedure
      .input(z.object({ requestId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        requireRole(ctx.user.role, "admin");

        const bonusQueries = await import("./db-queries-bonus");

        const request = await bonusQueries.getBonusRequestById(input.requestId);
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }

        if (request.status !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Request is already ${request.status}`,
          });
        }

        // Check quota again
        const quota = await bonusQueries.getDeptQuota(request.departmentId, request.yearMonth);
        if (!quota) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No quota set for this department and month",
          });
        }

        const approvedPoints = await bonusQueries.getApprovedBonusPointsForMonth(
          request.departmentId,
          request.yearMonth
        );

        if (approvedPoints + request.points > quota.quotaPoints) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Approving would exceed monthly quota",
          });
        }

        // Update request status
        await bonusQueries.updateBonusRequestStatus(
          input.requestId,
          "admin_approved",
          ctx.user.id
        );

        // Award points to user
        await dbQueries.createPointLedger({
          userId: request.userId,
          pointsDelta: request.points,
          reason: "dept_bonus",
          refId: request.id,
          departmentId: request.departmentId,
          createdBy: ctx.user.id,
        });

        // Update rank snapshot
        await rankService.updateUserRankSnapshot(request.userId);

        return { success: true };
      }),

    // Reject bonus request (Admin+)
    reject: protectedProcedure
      .input(z.object({ requestId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        requireRole(ctx.user.role, "admin");

        const bonusQueries = await import("./db-queries-bonus");

        const request = await bonusQueries.getBonusRequestById(input.requestId);
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }

        if (request.status !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Request is already ${request.status}`,
          });
        }

        await bonusQueries.updateBonusRequestStatus(input.requestId, "rejected", ctx.user.id);

        return { success: true };
      }),
  }),

  // Department quota management
  quota: router({
    // Set monthly quota (Admin+)
    set: protectedProcedure
      .input(
        z.object({
          departmentId: z.number(),
          yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
          quotaPoints: z.number().min(0),
        })
      )
      .mutation(async ({ input, ctx }) => {
        requireRole(ctx.user.role, "admin");

        const bonusQueries = await import("./db-queries-bonus");

        await bonusQueries.createDeptQuota({
          ...input,
          approvedBy: ctx.user.id,
        });

        return { success: true };
      }),

    // Get quota for department and month
    get: protectedProcedure
      .input(
        z.object({
          departmentId: z.number(),
          yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
        })
      )
      .query(async ({ input, ctx }) => {
        requireRole(ctx.user.role, "manager");

        const bonusQueries = await import("./db-queries-bonus");

        const quota = await bonusQueries.getDeptQuota(input.departmentId, input.yearMonth);
        if (!quota) {
          return null;
        }

        const approvedPoints = await bonusQueries.getApprovedBonusPointsForMonth(
          input.departmentId,
          input.yearMonth
        );

        return {
          ...quota,
          usedPoints: approvedPoints,
          remainingPoints: quota.quotaPoints - approvedPoints,
        };
      }),
  }),

  // WeChat OAuth simulation (code2Session)
  wechat: router({
    code2Session: publicProcedure
      .input(
        z.object({
          code: z.string(), // Volunteer code or WeChat code
          password: z.string().optional(), // Password for volunteer login
        })
      )
      .mutation(async ({ input }) => {
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        // Find user by volunteer code (openId or volunteerCode)
        const userList = await db.select().from(users).where(eq(users.volunteerCode, input.code)).limit(1);
        
        if (userList.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "志愿者编号不存在" });
        }

        const user = userList[0];

        // Verify password if provided
        if (input.password) {
          if (!user.password) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "该账号未设置密码，请联系管理员" });
          }
          const passwordService = await import("./services/password");
          const isValid = await passwordService.verifyPassword(input.password, user.password);
          if (!isValid) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "密码错误" });
          }
        }

        // Return session token (in real implementation, this would be a JWT)
        return {
          success: true,
          sessionToken: `session_${user.id}_${Date.now()}`,
          user: {
            id: user.id,
            name: user.name,
            role: user.role,
            phone: user.phone,
          },
        };
      }),
  }),



  // User registration
  register: router({
    // Self-registration for new users
    create: publicProcedure
      .input(
        z.object({
          name: z.string().min(1).max(64),
          phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Generate a unique volunteer code
        const volunteerCode = `V${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Create user with volunteer role
        const { users } = await import("../drizzle/schema");
        const result = await db.insert(users).values({
          openId: volunteerCode,
          name: input.name,
          phone: input.phone,
          role: "volunteer",
        });

        const userId = Number((result as any).insertId);

        // Initialize rank snapshot
        await rankService.updateUserRankSnapshot(userId);

        return {
          success: true,
          volunteerCode,
          message: "注册成功！请记住您的志愿者编号用于登录",
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
