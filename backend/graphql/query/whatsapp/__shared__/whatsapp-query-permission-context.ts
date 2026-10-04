import type { BaseContext } from "@/backend/graphql/gqlContext";
import type { UserPermissionContext } from "@/backend/types";

/**
 * Builds the caller-side `UserPermissionContext` handed from a WhatsApp query
 * resolver to its service, so no extra permission-context round-trip happens
 * per request. Shared by the WhatsApp workspace query registrations.
 */
export function whatsappQueryPermissionContext(ctx: BaseContext): UserPermissionContext {
  return {
    permissions: ctx.permissions,
    permissionGroups: ctx.permissionGroups,
    isSuperAdmin: ctx.isSuperAdmin,
    role: ctx.role,
  };
}
