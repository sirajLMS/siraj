"use client";

import { useNotifications } from "@toolpad/core/useNotifications";
import { useEffect } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useStudentDirectoryStore } from "@/frontend/common/stores/studentDirectoryStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { StudentDirectoryRowExtended } from "@/frontend/common/views/dashboard/admin/parents/students/types";
import type { StudentsLabelsBySection } from "@/frontend/common/views/dashboard/admin/parents/students/types/studentsDirectory.types";
import {
  createStudentHandlers,
  useComputedFilterArgs,
  useDerivedStudentData,
  useStudentDirectoryData,
} from "@/frontend/common/views/dashboard/admin/parents/students/useStudentsViewModel.hooks";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface StudentsViewModel {
  readonly labelsBySection: StudentsLabelsBySection;
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly StudentDirectoryRowExtended[];
  readonly totalStudents: number | undefined;
  readonly searchQuery: string;
  readonly page: number;
  readonly pageSize: number;
  readonly filterPanelOpen: boolean;
  readonly loading: boolean;
  readonly onSearchChange: (query: string) => void;
  readonly onPageChange: (page: number) => void;
  readonly onFilterClick: () => void;
  readonly onAddStudent: () => void;
  readonly onViewProfile: (id: string) => void;
  readonly onViewHistory: (id: string) => void;
  // Lifted permission gate: the ViewModel computes it once so tier views can read
  // a plain boolean instead of importing `RequirePermission`.
  readonly canStudentsCreate: boolean;
}

export function useStudentsViewModel(): StudentsViewModel {
  const t = useAppTranslation(Translation.Dashboard.StudentDirectory);
  const router = useRouter();
  const notifications = useNotifications();

  const hasPermission = useUserStore(state => state.hasPermission);
  const canStudentsCreate = hasPermission(AppPermission.StudentsCreate);

  const searchQuery = useStudentDirectoryStore(state => state.searchQuery);
  const setSearchQuery = useStudentDirectoryStore(state => state.setSearchQuery);
  const page = useStudentDirectoryStore(state => state.page);
  const pageSize = useStudentDirectoryStore(state => state.pageSize);
  const setPage = useStudentDirectoryStore(state => state.setPage);
  const filterArgs = useStudentDirectoryStore(state => state.filterArgs);
  const filterPanelOpen = useStudentDirectoryStore(state => state.filterPanelOpen);
  const setFilterPanelOpen = useStudentDirectoryStore(state => state.setFilterPanelOpen);

  const computedFilterArgs = useComputedFilterArgs(searchQuery, filterArgs);
  const { data, loading, error } = useStudentDirectoryData(computedFilterArgs, page, pageSize);

  useEffect(() => {
    if (error) {
      notifications.show(t.errors.loadFailed, {
        severity: "error",
        autoHideDuration: 5000,
      });
    }
  }, [error, notifications, t]);

  const { rows, totalStudents, viewMetrics, labelsBySection } = useDerivedStudentData(data, t);
  const { handleViewProfile, handleViewHistory, handleAddStudent, handleFilterClick } = createStudentHandlers(
    router,
    setFilterPanelOpen,
    filterPanelOpen
  );

  return {
    labelsBySection,
    metrics: viewMetrics,
    rows,
    totalStudents,
    searchQuery,
    page,
    pageSize,
    filterPanelOpen,
    loading,
    onSearchChange: setSearchQuery,
    onPageChange: setPage,
    onFilterClick: handleFilterClick,
    onAddStudent: handleAddStudent,
    onViewProfile: handleViewProfile,
    onViewHistory: handleViewHistory,
    canStudentsCreate,
  };
}
