"use client";

import { useMemo, useState } from "react";
import { useManagersStore } from "@/frontend/stores/managersStore";
import { ManagersView } from "./ManagersView";

export function ManagersContainer() {
  const managers = useManagersStore(state => state.managers);
  const metrics = useManagersStore(state => state.metrics);

  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "staff">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "offline">("all");

  const filteredManagers = useMemo(() => {
    return managers.filter(manager => {
      const matchesRole = roleFilter === "all" || manager.role === roleFilter;
      const matchesStatus = statusFilter === "all" || manager.status === statusFilter;
      return matchesRole && matchesStatus;
    });
  }, [managers, roleFilter, statusFilter]);

  return (
    <ManagersView
      managers={filteredManagers}
      metrics={metrics}
      totalManagers={managers.length}
      roleFilter={roleFilter}
      statusFilter={statusFilter}
      onRoleFilterChange={setRoleFilter}
      onStatusFilterChange={setStatusFilter}
    />
  );
}
