"use client";

import { useQuery } from "@apollo/client/react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { managerDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/teachers/staff-directory.documents";
import { useStaffDirectoryStore } from "@/frontend/common/stores/staffDirectoryStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  Manager,
  ManagerRole,
  ManagerRoleFilter,
  ManagerStatus,
  ManagerStatusFilter,
  NonNullableManagerDirectoryMetrics,
} from "@/frontend/common/views/dashboard/staff/home/types";
import { type StaffDirectoryLabels, Translation, useAppTranslation } from "@/shared/locale";

function mapManagerRole(roleSlug: string | null | undefined): ManagerRole {
  if (!roleSlug) return "manager";
  if (roleSlug.includes("admin")) return "admin";
  if (roleSlug.includes("supervisor")) return "supervisor";
  return "manager";
}

function mapManagerStatus(status: string | null | undefined): ManagerStatus {
  if (!status) return "offline";
  return status.toLowerCase() === "activated" ? "active" : "offline";
}

interface ManagerDirectoryRow {
  id: string | null;
  staffProfileId: string | null;
  name: string | null;
  roleSlug: string | null;
  status: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

interface ManagerDirectoryMetricsRow {
  id: string | null;
  totalAdmin: number | null;
  systemStaff: number | null;
  activeNow: number | null;
  alerts: number | null;
}

const EMPTY_METRICS: NonNullableManagerDirectoryMetrics = {
  id: "manager-directory-metrics",
  totalAdmin: 0,
  systemStaff: 0,
  activeNow: 0,
  alerts: 0,
};

function buildManagerRows(rawRows: readonly ManagerDirectoryRow[] | null | undefined): Manager[] {
  if (!rawRows) return [];
  return rawRows.map(row => ({
    userId: row.id ?? "",
    staffProfileId: row.staffProfileId ?? "",
    name: row.name ?? "",
    role: mapManagerRole(row.roleSlug),
    status: mapManagerStatus(row.status),
    email: row.email ?? "",
    phone: row.phone ?? "",
    avatarUrl: row.avatarUrl ?? "",
    targetIsSuperAdmin: row.roleSlug === "super_admin",
  }));
}

function buildManagerMetrics(
  apiMetrics: ManagerDirectoryMetricsRow | null | undefined
): NonNullableManagerDirectoryMetrics {
  if (!apiMetrics) return EMPTY_METRICS;
  return {
    id: apiMetrics.id ?? "",
    totalAdmin: apiMetrics.totalAdmin ?? 0,
    systemStaff: apiMetrics.systemStaff ?? 0,
    activeNow: apiMetrics.activeNow ?? 0,
    alerts: apiMetrics.alerts ?? 0,
  };
}

function resolveFilter<T extends string>(filter: T): T | null {
  return filter === "all" ? null : filter;
}

export interface ManagersContainerViewModel {
  readonly labels: StaffDirectoryLabels;
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
  // NEW FOR PLAN v5: canCreateManager exposed by the Container VM so the tier views no longer wrap a RequirePermission around the action button.
  readonly canCreateManager: boolean;
}

export interface UseManagersContainerViewModelProps {
  readonly onRetry?: () => void;
}

export function useManagersContainerViewModel(
  _props: Readonly<UseManagersContainerViewModelProps>
): ManagersContainerViewModel {
  const labels = useAppTranslation(Translation.Dashboard.StaffDirectory);
  const roleFilter = useStaffDirectoryStore(state => state.roleFilter);
  const statusFilter = useStaffDirectoryStore(state => state.statusFilter);
  const setRoleFilter = useStaffDirectoryStore(state => state.setRoleFilter);
  const setStatusFilter = useStaffDirectoryStore(state => state.setStatusFilter);
  const page = useStaffDirectoryStore(state => state.page);
  const pageSize = useStaffDirectoryStore(state => state.pageSize);
  const setPage = useStaffDirectoryStore(state => state.setPage);
  const permissions = useUserStore(state => state.permissions);
  const canCreateManager = permissions.includes(AppPermission.StaffCreate);

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
      roleFilter: resolveFilter(roleFilter),
      statusFilter: resolveFilter(statusFilter),
    },
    fetchPolicy: "cache-and-network",
  });

  if (error) {
    logger.error("Error loading managers directory:", { error });
  }

  const rows = buildManagerRows(data?.managerDirectory?.rows);
  const metrics = buildManagerMetrics(data?.managerDirectory?.metrics);
  const totalCount = data ? (data.managerDirectory?.totalCount ?? 0) : undefined;

  return {
    labels,
    managers: rows,
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
    canCreateManager,
  };
}
