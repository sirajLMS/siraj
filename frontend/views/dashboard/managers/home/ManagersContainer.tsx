"use client";

import { useQuery } from "@apollo/client/react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { managerDirectoryQueryDocument } from "@/frontend/graphql/sharedDocuments/staff-directory.documents";
import { useManagersDirectoryStore } from "@/frontend/stores/managersDirectoryStore";
import { ManagersView } from "./ManagersView";
import type { Manager, ManagerRole, ManagerStatus } from "./types";

function mapManagerRole(roleSlug: string | null | undefined): ManagerRole {
  if (!roleSlug) return "staff";
  return roleSlug.includes("admin") ? "admin" : "staff";
}

function mapManagerStatus(status: string | null | undefined): ManagerStatus {
  if (!status) return "offline";
  return status.toLowerCase() === "activated" ? "active" : "offline";
}

export function ManagersContainer() {
  const roleFilter = useManagersDirectoryStore(state => state.roleFilter);
  const statusFilter = useManagersDirectoryStore(state => state.statusFilter);
  const setRoleFilter = useManagersDirectoryStore(state => state.setRoleFilter);
  const setStatusFilter = useManagersDirectoryStore(state => state.setStatusFilter);
  const page = useManagersDirectoryStore(state => state.page);
  const pageSize = useManagersDirectoryStore(state => state.pageSize);
  const setPage = useManagersDirectoryStore(state => state.setPage);

  const { data, loading } = useQuery(managerDirectoryQueryDocument, {
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
      roleFilter: roleFilter === "all" ? null : roleFilter,
      statusFilter: statusFilter === "all" ? null : statusFilter,
    },
    fetchPolicy: "cache-and-network",
  });

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

  return (
    <RequirePermission permissions={[AppPermission.StaffViewDirectory]}>
      <ManagersView
        managers={rows ?? []}
        metrics={metrics}
        totalManagers={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onRoleFilterChange={setRoleFilter}
        onStatusFilterChange={setStatusFilter}
        loading={loading}
      />
    </RequirePermission>
  );
}
