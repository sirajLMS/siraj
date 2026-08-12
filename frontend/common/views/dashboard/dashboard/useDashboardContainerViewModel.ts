"use client";

import { useUserStore } from "@/frontend/common/stores/userStore";
import {
  type DashboardRole,
  resolveDashboardRole,
} from "@/frontend/common/views/dashboard/dashboard/dashboardRoleHelpers";

export type { DashboardRole };

export interface DashboardContainerViewModel {
  readonly role: DashboardRole;
  readonly userName: string;
  readonly loading: boolean;
}

export interface UseDashboardContainerViewModelProps {
  readonly onRetry?: () => void;
}

export function useDashboardContainerViewModel(
  _props: Readonly<UseDashboardContainerViewModelProps>
): DashboardContainerViewModel {
  /**
   * The user store is seeded by UserStoreInitializer (rendered in
   * DashboardClientBridge) before this component mounts, so `user` is already
   * populated on first render — no Apollo query needed here.
   */
  const { user } = useUserStore();

  const permissions = user?.permissions ?? [];
  const userName = user?.name ?? "";

  const role: DashboardRole = resolveDashboardRole(permissions);

  return {
    role,
    userName,
    // No async loading — role is derived synchronously from the user store
    loading: false,
  };
}
