import { TRPCError } from "@trpc/server";
import { hasRoleLevel } from "../../shared/constants";

/**
 * RBAC Middleware for role-based access control
 * Role hierarchy: volunteer < leader < manager < admin < super-admin
 */

export type UserRole = "volunteer" | "leader" | "manager" | "admin" | "super-admin";

/**
 * Check if user has required role level
 * @throws TRPCError with FORBIDDEN code if user lacks permission
 */
export function requireRole(userRole: UserRole, requiredRole: UserRole): void {
  if (!hasRoleLevel(userRole, requiredRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `This operation requires ${requiredRole} role or higher. Your role: ${userRole}`,
    });
  }
}

/**
 * Check if user can manage another user (must be higher role)
 */
export function canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
  const roleOrder: UserRole[] = ["volunteer", "leader", "manager", "admin", "super-admin"];
  const managerLevel = roleOrder.indexOf(managerRole);
  const targetLevel = roleOrder.indexOf(targetRole);
  
  return managerLevel > targetLevel;
}

/**
 * Check if user can access department
 * Leaders and managers can only access their assigned departments
 * Admins can access all departments
 */
export function canAccessDepartment(
  userRole: UserRole,
  userId: number,
  departmentId: number,
  userDepartments: number[]
): boolean {
  // Admins and super-admins can access all departments
  if (hasRoleLevel(userRole, "admin")) {
    return true;
  }

  // Leaders and managers can only access their assigned departments
  if (hasRoleLevel(userRole, "leader")) {
    return userDepartments.includes(departmentId);
  }

  // Volunteers can only view, not manage
  return false;
}

/**
 * Check if user can approve bonus requests
 * Only admins can approve
 */
export function canApproveBonusRequest(userRole: UserRole): boolean {
  return hasRoleLevel(userRole, "admin");
}

/**
 * Check if user can create bonus requests
 * Managers and above can create requests for their departments
 */
export function canCreateBonusRequest(userRole: UserRole): boolean {
  return hasRoleLevel(userRole, "manager");
}

/**
 * Check if user can manage schedules
 * Leaders and above can manage schedules for their departments
 */
export function canManageSchedule(userRole: UserRole): boolean {
  return hasRoleLevel(userRole, "leader");
}

/**
 * Check if user can confirm attendance
 * Leaders and above can confirm attendance
 */
export function canConfirmAttendance(userRole: UserRole): boolean {
  return hasRoleLevel(userRole, "leader");
}

/**
 * Check if user can manage payroll
 * Only admins can manage payroll
 */
export function canManagePayroll(userRole: UserRole): boolean {
  return hasRoleLevel(userRole, "admin");
}

/**
 * Check if user can manage rewards
 * Only admins can create/edit/delete rewards
 */
export function canManageRewards(userRole: UserRole): boolean {
  return hasRoleLevel(userRole, "admin");
}

/**
 * Check if user can view audit logs
 * Managers and above can view audit logs
 */
export function canViewAuditLogs(userRole: UserRole): boolean {
  return hasRoleLevel(userRole, "manager");
}

/**
 * Get allowed operations for a role
 */
export function getAllowedOperations(userRole: UserRole): string[] {
  const operations: string[] = [];

  // All users can view their own profile and redeem rewards
  operations.push("view_own_profile", "redeem_rewards", "view_rewards");

  if (hasRoleLevel(userRole, "leader")) {
    operations.push("manage_schedule", "confirm_attendance", "view_department_data");
  }

  if (hasRoleLevel(userRole, "manager")) {
    operations.push("create_bonus_request", "manage_department", "view_audit_logs");
  }

  if (hasRoleLevel(userRole, "admin")) {
    operations.push(
      "approve_bonus_request",
      "manage_users",
      "manage_rewards",
      "manage_payroll",
      "view_all_data",
      "manage_system"
    );
  }

  if (userRole === "super-admin") {
    operations.push("manage_admins", "system_configuration");
  }

  return operations;
}
