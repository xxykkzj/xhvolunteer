import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../../_core/trpc";
import { getUserByEmail } from "../../db-queries";
import { verifyPassword } from "../../services/password";
import { sign } from "jsonwebtoken";
import { ENV } from "../../_core/env";
import { COOKIE_NAME } from "../../../shared/const";
import { getSessionCookieOptions } from "../../_core/cookies";

/**
 * Email/Password Login Router
 * Provides login functionality for admin users using email and password
 */
export const emailLoginRouter = router({
  /**
   * Login with email and password
   * Returns session token in HTTP-only cookie
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      // Find user by email
      const user = await getUserByEmail(email);

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Verify password
      if (!user.password) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "This account does not have a password set. Please contact administrator.",
        });
      }

      const isValidPassword = await verifyPassword(password, user.password);

      if (!isValidPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Generate session token
      const token = sign(
        {
          userId: user.id,
          openId: user.openId,
          role: user.role,
        },
        ENV.jwtSecret,
        { expiresIn: "7d" }
      );

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),
});
