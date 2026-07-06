"use client";

import { useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import type { StudentFilterArgs } from "@/frontend/graphql/generated/gql/graphql-types";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { studentDirectoryQueryDocument } from "@/frontend/graphql/sharedDocuments/student-directory.documents";
import { useStudentDirectoryStore } from "@/frontend/stores/studentDirectoryStore";
import { StudentsView } from "@/frontend/views/dashboard/admin/parents/students/StudentsView";
import {
  buildLabels,
  buildMobileMetrics,
  buildStatusCounts,
  buildStudentRows,
  buildViewMetrics,
} from "@/frontend/views/dashboard/admin/parents/students/utils";
import { useRouter } from "@/shared/i18n/routing";

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

export function StudentsContainer() {
  const t = useTranslations("dashboard.studentDirectory");
  const router = useRouter();
  const notifications = useNotifications();

  const searchQuery = useStudentDirectoryStore(state => state.searchQuery);
  const setSearchQuery = useStudentDirectoryStore(state => state.setSearchQuery);
  const page = useStudentDirectoryStore(state => state.page);
  const pageSize = useStudentDirectoryStore(state => state.pageSize);
  const setPage = useStudentDirectoryStore(state => state.setPage);
  const filterArgs = useStudentDirectoryStore(state => state.filterArgs);
  const filterPanelOpen = useStudentDirectoryStore(state => state.filterPanelOpen);
  const setFilterPanelOpen = useStudentDirectoryStore(state => state.setFilterPanelOpen);

  const computedFilterArgs = useMemo<StudentFilterArgs | null>(() => {
    if (!searchQuery && !filterArgs) return null;
    return {
      ...EMPTY_FILTER_ARGS,
      ...(filterArgs ? { gender: filterArgs.gender, language: filterArgs.language, status: filterArgs.status } : {}),
      name: searchQuery || filterArgs?.name || null,
    };
  }, [searchQuery, filterArgs]);

  const { data, error } = useQuery(studentDirectoryQueryDocument, {
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

  useEffect(() => {
    if (error) {
      notifications.show(t("loadFailed"), {
        severity: "error",
        autoHideDuration: 5000,
      });
    }
  }, [error, notifications, t]);

  const rows = useMemo(() => buildStudentRows(data), [data]);
  const totalCount = data?.studentDirectory?.totalCount ?? 0;
  const counts = useMemo(() => buildStatusCounts(rows), [rows]);
  const viewMetrics = useMemo(() => buildViewMetrics(counts, t), [counts, t]);
  const mobileMetrics = useMemo(() => buildMobileMetrics(counts, t), [counts, t]);
  const labels = useMemo(() => buildLabels(t), [t]);

  const handleViewProfile = (id: string) => {
    router.push(`/students/${id}`);
  };

  const handleViewHistory = (id: string) => {
    router.push(`/students/${id}/history`);
  };

  const handleAddStudent = () => {
    router.push("/students/new");
  };

  const handleFilterClick = () => {
    setFilterPanelOpen(!filterPanelOpen);
  };

  return (
    <RequirePermission permissions={[AppPermission.StudentsList]}>
      <StudentsView
        metrics={viewMetrics}
        mobileMetrics={mobileMetrics}
        rows={rows}
        totalStudents={totalCount}
        searchQuery={searchQuery}
        page={page}
        pageSize={pageSize}
        labels={labels}
        onSearchChange={setSearchQuery}
        onAddStudent={handleAddStudent}
        onViewProfile={handleViewProfile}
        onViewHistory={handleViewHistory}
        onPageChange={setPage}
        onFilterClick={handleFilterClick}
      />
    </RequirePermission>
  );
}
