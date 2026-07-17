"use client";

import type {
  Manager,
  ManagerRoleFilter,
  ManagerStatusFilter,
  NonNullableManagerDirectoryMetrics,
} from "@/frontend/common/views/dashboard/managers/home/types";

export interface ManagersViewModel {
  readonly managers: readonly Manager[];
  readonly metrics: NonNullableManagerDirectoryMetrics;
  readonly totalManagers: number | undefined;
  readonly loading: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
  readonly roleFilter: ManagerRoleFilter;
  readonly statusFilter: ManagerStatusFilter;
  readonly onRoleFilterChange: (role: ManagerRoleFilter) => void;
  readonly onStatusFilterChange: (status: ManagerStatusFilter) => void;
}

export type UseManagersViewModelProps = ManagersViewModel;

export function useManagersViewModel(props: Readonly<UseManagersViewModelProps>): ManagersViewModel {
  return props;
}
