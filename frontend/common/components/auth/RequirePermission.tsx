"use client";

import type { ReactNode } from "react";
import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/lib/logger";
import { useUserStore } from "@/frontend/common/stores/userStore";

export interface RequirePermissionProps {
  /**
   * The child content to render if the user has the required permissions.
   */
  readonly children: ReactNode;

  /**
   * A single permission or an array of permissions.
   * If an array is provided, the user must have at least one of the permissions to view the content.
   */
  readonly permissions: AppPermission | readonly AppPermission[];

  /**
   * The fallback content to render if the user does NOT have the required permissions.
   * Defaults to null.
   */
  readonly fallback?: ReactNode;
}

/**
 * A wrapper component that conditionally renders its children based on the current user's permissions.
 * It uses the global real `useUserStore` state to evaluate authorization.
 */
export function RequirePermission({ children, permissions, fallback = null }: RequirePermissionProps) {
  const { hasPermission } = useUserStore();

  const permissionsArray: readonly AppPermission[] = Array.isArray(permissions) ? permissions : [permissions];

  const isAuthorized = permissionsArray.some(permission => hasPermission(permission));

  if (!isAuthorized) {
    if (process.env.NEXT_PUBLIC_DEBUG_PERMISSIONS === "true") {
      logger.debug({ caller: "RequirePermission" }, `Access denied for ${String(permissions)}`);
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
