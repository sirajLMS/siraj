"use client";

import { useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEffect, useMemo } from "react";
import { AppPermission, type StudentFilterArgs } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { StudentDirectoryQuery } from "@/frontend/common/graphql/generated/gql/operations";
import { studentDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-directory.documents";
import { useStudentDirectoryStore } from "@/frontend/common/stores/studentDirectoryStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { studentHref, studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import type {
  StudentDirectoryRowExtended,
  StudentsViewLabels,
} from "@/frontend/common/views/dashboard/admin/parents/students/types";
import {
  buildLabels,
  buildMobileMetrics,
  buildStatusCounts,
  buildStudentRows,
  buildViewMetrics,
} from "@/frontend/common/views/dashboard/admin/parents/students/utils";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { useRouter } from "@/shared/i18n/routing";
import { type StudentDirectoryLabels, useAppTranslation } from "@/shared/locale";

const EMPTY_FILTER_ARGS: StudentFilterArgs = {
  birthDate: null,
  birthDateAfter: null,
  birthDateBefore: null,
  birthDateFrom: null,
  birthDateIsEmpty: null,
  birthDateIsNotEmpty: null,
  birthDateNot: null,
  birthDateOnOrAfter: null,
  birthDateOnOrBefore: null,
  birthDateTo: null,
  createdAt: null,
  createdAtAfter: null,
  createdAtBefore: null,
  createdAtFrom: null,
  createdAtIsEmpty: null,
  createdAtIsNotEmpty: null,
  createdAtNot: null,
  createdAtOnOrAfter: null,
  createdAtOnOrBefore: null,
  createdAtTo: null,
  gender: null,
  language: null,
  name: null,
  nameEndsWith: null,
  nameEquals: null,
  nameIsEmpty: null,
  nameIsNotEmpty: null,
  nameNotContains: null,
  nameNotEquals: null,
  nameStartsWith: null,
  parentId: null,
  primaryTeacherId: null,
  status: null,
};

const DEFAULT_PAGINATION_ARGS = {
  first: 10,
  page: 1,
  skip: null,
  after: null,
  before: null,
  last: null,
  maxCount: null,
};

export interface StudentsViewModel {
  readonly labels: StudentsViewLabels;
  readonly metrics: readonly MetricItem[];
  readonly mobileMetrics: readonly MetricItem[];
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
  // NEW FOR PLAN v5: lifted permission boolean per specs.md §3 N3 + §6.1.
  // Tier student-directory views no longer import `RequirePermission`; the
  // ViewModel computes the gate ONCE and the tier view reads the boolean.
  readonly canStudentsCreate: boolean;
}

type StudentDirectoryTranslator = StudentDirectoryLabels;

function useComputedFilterArgs(searchQuery: string, filterArgs: StudentFilterArgs | null): StudentFilterArgs | null {
  return useMemo<StudentFilterArgs | null>(() => {
    if (!searchQuery && !filterArgs) return null;
    return {
      ...EMPTY_FILTER_ARGS,
      ...(filterArgs ? { gender: filterArgs.gender, language: filterArgs.language, status: filterArgs.status } : {}),
      name: searchQuery || filterArgs?.name || null,
    };
  }, [searchQuery, filterArgs]);
}

function useStudentDirectoryData(computedFilterArgs: StudentFilterArgs | null, page: number, pageSize: number) {
  return useQuery(studentDirectoryQueryDocument, {
    variables: {
      filterArgs: computedFilterArgs,
      orderBy: null,
      paginationArgs: {
        ...DEFAULT_PAGINATION_ARGS,
        first: pageSize,
        page: page + 1,
      },
    },
    fetchPolicy: "cache-and-network",
  });
}

function useDerivedStudentData(data: StudentDirectoryQuery | undefined, t: StudentDirectoryTranslator) {
  const rows = useMemo(() => buildStudentRows(data), [data]);
  const totalStudents = data ? (data.studentDirectory?.totalCount ?? 0) : undefined;
  const counts = useMemo(() => buildStatusCounts(rows), [rows]);
  const viewMetrics = useMemo(() => buildViewMetrics(counts, t), [counts, t]);
  const mobileMetrics = useMemo(() => buildMobileMetrics(counts, t), [counts, t]);
  const labels = useMemo(() => buildLabels(t), [t]);
  return { rows, totalStudents, viewMetrics, mobileMetrics, labels };
}

function createStudentHandlers(
  router: ReturnType<typeof useRouter>,
  setFilterPanelOpen: (open: boolean) => void,
  filterPanelOpen: boolean
) {
  const handleViewProfile = (id: string) => {
    router.push(studentHref(id));
  };

  const handleViewHistory = (id: string) => {
    router.push(studentProfileTabHref(id, "history"));
  };

  const handleAddStudent = () => {
    router.push("/students/onboarding");
  };

  const handleFilterClick = () => {
    setFilterPanelOpen(!filterPanelOpen);
  };

  return { handleViewProfile, handleViewHistory, handleAddStudent, handleFilterClick };
}

export function useStudentsViewModel(): StudentsViewModel {
  const t = useAppTranslation().dashboardTranslations.studentDirectory;
  const router = useRouter();
  const notifications = useNotifications();

  // NEW FOR PLAN v5: read the user's permission ONCE and expose it as a boolean.
  // Tier student-directory views no longer import `RequirePermission` or call
  // `useUserStore()` (specs.md §3 N3).
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

  const { rows, totalStudents, viewMetrics, mobileMetrics, labels } = useDerivedStudentData(data, t);
  const { handleViewProfile, handleViewHistory, handleAddStudent, handleFilterClick } = createStudentHandlers(
    router,
    setFilterPanelOpen,
    filterPanelOpen
  );

  return {
    labels,
    metrics: viewMetrics,
    mobileMetrics,
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
    // NEW FOR PLAN v5: lifted permission boolean consumed by the tier view.
    canStudentsCreate,
  };
}
