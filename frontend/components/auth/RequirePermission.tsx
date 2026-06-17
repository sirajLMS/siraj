"use client";

import type { ReactNode } from "react";
import { useUserStore } from "@/frontend/stores/userStore";

export interface RequirePermissionProps {
  /**
   * The child content to render if the user has the required permissions.
   */
  readonly children: ReactNode;

  /**
   * A single permission string or an array of permission strings.
   * If an array is provided, the user must have at least one of the permissions to view the content.
   */
  readonly permissions: string | readonly string[];

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

  const isAuthorized =
    typeof permissions === "string"
      ? hasPermission(permissions)
      : permissions.some(permission => hasPermission(permission));

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
