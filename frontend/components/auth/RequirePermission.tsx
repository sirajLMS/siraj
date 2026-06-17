"use client";

import type { ReactNode } from "react";
import type { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";

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

  const isAuthorized = Array.isArray(permissions)
    ? permissions.some(permission => hasPermission(permission))
    : hasPermission(permissions as AppPermission);

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
