"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { managerDirectoryQueryDocument } from "@/frontend/graphql/sharedDocuments/staff-directory.documents";
import { useManagersDirectoryStore } from "@/frontend/stores/managersDirectoryStore";
import { ManagersView } from "./ManagersView";
import type { ManagerRole, ManagerStatus } from "./types";

function mapManagerRole(roleSlug: string | null | undefined): ManagerRole {
  if (!roleSlug) return "staff";
  return roleSlug.includes("admin") ? "admin" : "staff";
}

function mapManagerStatus(status: string | null | undefined): ManagerStatus {
  if (!status) return "offline";
  return status.toLowerCase() === "active" ? "active" : "offline";
}

export function ManagersContainer() {
  const roleFilter = useManagersDirectoryStore(state => state.roleFilter);
  const statusFilter = useManagersDirectoryStore(state => state.statusFilter);
  const setRoleFilter = useManagersDirectoryStore(state => state.setRoleFilter);
  const setStatusFilter = useManagersDirectoryStore(state => state.setStatusFilter);
  const page = useManagersDirectoryStore(state => state.page);
  const pageSize = useManagersDirectoryStore(state => state.pageSize);
  const setPage = useManagersDirectoryStore(state => state.setPage);

  const { data } = useQuery(managerDirectoryQueryDocument, {
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
    },
    fetchPolicy: "cache-and-network",
  });

  const rawRows = data?.managerDirectory?.rows;

  const rows = useMemo(() => {
    if (!rawRows) return [];
    return rawRows.map((row, index) => ({
      id: row.id ?? "",
      name: row.name ?? "",
      role: mapManagerRole(row.roleSlug),
      status: mapManagerStatus(row.status),
      email: row.email ?? "",
      skypeId: row.skypeId ?? "",
      phone: row.phone ?? "",
      avatarUrl: `/demo/avatars/${String((index % 8) + 1).padStart(2, "0")}.png`,
    }));
  }, [rawRows]);

  const totalCount = data?.managerDirectory?.totalCount ?? 0;

  const metrics = useMemo(() => {
    let totalAdmin = 0;
    let systemStaff = 0;
    let activeNow = 0;
    for (const r of rows) {
      if (r.role === "admin") totalAdmin++;
      if (r.role === "staff") systemStaff++;
      if (r.status === "active") activeNow++;
    }
    return {
      totalAdmin,
      systemStaff,
      activeNow,
      alerts: 0,
    };
  }, [rows]);

  const filteredManagers = useMemo(() => {
    return rows.filter(manager => {
      const matchesRole = roleFilter === "all" || manager.role === roleFilter;
      const matchesStatus = statusFilter === "all" || manager.status === statusFilter;
      return matchesRole && matchesStatus;
    });
  }, [rows, roleFilter, statusFilter]);

  return (
    <RequirePermission permissions={[AppPermission.StaffViewDirectory]}>
      <ManagersView
        managers={filteredManagers}
        metrics={metrics}
        totalManagers={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onRoleFilterChange={setRoleFilter}
        onStatusFilterChange={setStatusFilter}
      />
    </RequirePermission>
  );
}
