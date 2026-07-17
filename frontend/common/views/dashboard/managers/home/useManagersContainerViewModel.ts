"use client";

import { useQuery } from "@apollo/client/react";
import { managerDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/teachers/staff-directory.documents";
import { useManagersDirectoryStore } from "@/frontend/common/stores/managersDirectoryStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  Manager,
  ManagerRole,
  ManagerStatus,
  NonNullableManagerDirectoryMetrics,
} from "@/frontend/common/views/dashboard/managers/home/types";

function mapManagerRole(roleSlug: string | null | undefined): ManagerRole {
  if (!roleSlug) return "staff";
  return roleSlug.includes("admin") ? "admin" : "staff";
}

function mapManagerStatus(status: string | null | undefined): ManagerStatus {
  if (!status) return "offline";
  return status.toLowerCase() === "activated" ? "active" : "offline";
}

export interface ManagersContainerViewModel {
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

export interface UseManagersContainerViewModelProps {
  readonly onRetry?: () => void;
}

type ManagerRoleFilter = "all" | "admin" | "staff";
type ManagerStatusFilter = "all" | "active" | "offline";

export function useManagersContainerViewModel(
  _props: Readonly<UseManagersContainerViewModelProps>
): ManagersContainerViewModel {
  const roleFilter = useManagersDirectoryStore(state => state.roleFilter);
  const statusFilter = useManagersDirectoryStore(state => state.statusFilter);
  const setRoleFilter = useManagersDirectoryStore(state => state.setRoleFilter);
  const setStatusFilter = useManagersDirectoryStore(state => state.setStatusFilter);
  const page = useManagersDirectoryStore(state => state.page);
  const pageSize = useManagersDirectoryStore(state => state.pageSize);
  const setPage = useManagersDirectoryStore(state => state.setPage);

  const resolvedRoleFilter = roleFilter !== "all" ? roleFilter : null;
  const resolvedStatusFilter = statusFilter !== "all" ? statusFilter : null;

  const { data, loading, error } = useQuery(managerDirectoryQueryDocument, {
    variables: {
      paginationArgs: {
        first: pageSize,
        page: page + 1,
        skip: null,
        after: null,
        before: null,
        last: null,
        maxCount: null,
      },
      roleFilter: resolvedRoleFilter,
      statusFilter: resolvedStatusFilter,
    },
    fetchPolicy: "cache-and-network",
  });

  if (error) {
    logger.error("Error loading managers directory:", { error });
  }

  const rawRows = data?.managerDirectory?.rows;
  const apiMetrics = data?.managerDirectory?.metrics;

  const rows = rawRows?.map(row => ({
    userId: row.id ?? "",
    staffProfileId: row.staffProfileId ?? "",
    name: row.name ?? "",
    role: mapManagerRole(row.roleSlug),
    status: mapManagerStatus(row.status),
    email: row.email ?? "",
    phone: row.phone ?? "",
    avatarUrl: row.avatarUrl ?? "",
    targetIsSuperAdmin: row.roleSlug === "super_admin",
  })) as Manager[];

  const metrics = apiMetrics
    ? {
        id: apiMetrics.id ?? "",
        totalAdmin: apiMetrics.totalAdmin ?? 0,
        systemStaff: apiMetrics.systemStaff ?? 0,
        activeNow: apiMetrics.activeNow ?? 0,
        alerts: apiMetrics.alerts ?? 0,
      }
    : {
        id: "manager-directory-metrics",
        totalAdmin: 0,
        systemStaff: 0,
        activeNow: 0,
        alerts: 0,
      };

  const totalCount = data ? (data.managerDirectory?.totalCount ?? 0) : undefined;

  return {
    managers: rows ?? [],
    metrics,
    totalManagers: totalCount,
    loading,
    page,
    pageSize,
    onPageChange: setPage,
    roleFilter,
    statusFilter,
    onRoleFilterChange: setRoleFilter,
    onStatusFilterChange: setStatusFilter,
  };
}
