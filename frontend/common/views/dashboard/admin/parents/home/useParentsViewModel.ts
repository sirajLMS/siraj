"use client";

import { useParentsStore } from "@/frontend/common/stores/parentsStore";
import type { ParentsViewModel } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
import {
  useDirectoryMetrics,
  useDirectoryRows,
} from "@/frontend/common/views/dashboard/admin/parents/home/useParentsViewModel.helpers";
import {
  useParentHandlers,
  useParentPermissionGates,
  useParentsDirectoryQuery,
} from "@/frontend/common/views/dashboard/admin/parents/home/useParentsViewModel.hooks";
import { buildLabelsBySection } from "@/frontend/common/views/dashboard/admin/parents/home/useParentsViewModel.labels";
import { Translation, useAppTranslation } from "@/shared/locale";

export type UseParentsViewModelProps = Record<string, never>;

export function useParentsViewModel(_props: Readonly<UseParentsViewModelProps>): ParentsViewModel {
  const t = useAppTranslation(Translation.Dashboard.ParentsDirectory);

  const { canParentsCreate, canParentManageStatus } = useParentPermissionGates();

  const {
    searchQuery,
    page,
    pageSize,
    lifecycleStatusFilter,
    filterPanelOpen,
    setLifecycleStatusFilter,
    resetFilters,
  } = useParentsStore();

  const { data, loading } = useParentsDirectoryQuery();
  const directory = data?.parentDirectory;
  const metrics = useDirectoryMetrics(directory ?? null);
  const rows = useDirectoryRows(directory ?? null);
  const labelsBySection = buildLabelsBySection(t);

  const handlers = useParentHandlers(rows, labelsBySection);

  return {
    metrics,
    rows,
    labelsBySection,
    loading,
    page,
    pageSize,
    totalCount: directory ? (directory.totalCount ?? 0) : undefined,
    searchQuery,
    lifecycleStatusFilter,
    filterPanelOpen,
    onLifecycleStatusFilterChange: setLifecycleStatusFilter,
    onResetFilters: resetFilters,
    ...handlers,
    canParentsCreate,
    canParentManageStatus,
  };
}
