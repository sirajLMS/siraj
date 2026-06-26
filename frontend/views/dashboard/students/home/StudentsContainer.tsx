"use client";

import { useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { studentDirectoryQueryDocument } from "@/frontend/graphql/sharedDocuments/student-directory.documents";
import { useStudentDirectoryStore } from "@/frontend/stores/studentDirectoryStore";
import { StudentsView } from "./StudentsView";
import {
  buildFilteredRows,
  buildLabels,
  buildMobileMetrics,
  buildStatusCounts,
  buildStudentRows,
  buildViewMetrics,
} from "./utils";

export function StudentsContainer() {
  const t = useTranslations("dashboard.studentDirectory");
  const router = useRouter();

  const searchQuery = useStudentDirectoryStore(state => state.searchQuery);
  const setSearchQuery = useStudentDirectoryStore(state => state.setSearchQuery);
  const page = useStudentDirectoryStore(state => state.page);
  const pageSize = useStudentDirectoryStore(state => state.pageSize);
  const setPage = useStudentDirectoryStore(state => state.setPage);

  const { data } = useQuery(studentDirectoryQueryDocument, {
    variables: {
      filterArgs: null,
      orderBy: null,
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

  const rows = useMemo(() => buildStudentRows(data), [data]);
  const counts = useMemo(() => buildStatusCounts(rows), [rows]);
  const filteredRows = useMemo(() => buildFilteredRows(rows, searchQuery), [rows, searchQuery]);
  const viewMetrics = useMemo(() => buildViewMetrics(counts, t), [counts, t]);
  const mobileMetrics = useMemo(() => buildMobileMetrics(counts, t), [counts, t]);
  const labels = useMemo(() => buildLabels(t), [t]);

  const handleViewProfile = (id: string) => {
    router.push(`/students/${id}`);
  };

  const handleViewHistory = (id: string) => {
    router.push(`/students/${id}/history`);
  };

  const handleAddStudent = () => {};

  return (
    <RequirePermission permissions={[AppPermission.StudentsList]}>
      <StudentsView
        metrics={viewMetrics}
        mobileMetrics={mobileMetrics}
        rows={filteredRows}
        totalStudents={rows.length}
        searchQuery={searchQuery}
        page={page}
        pageSize={pageSize}
        labels={labels}
        onSearchChange={setSearchQuery}
        onAddStudent={handleAddStudent}
        onViewProfile={handleViewProfile}
        onViewHistory={handleViewHistory}
        onPageChange={setPage}
      />
    </RequirePermission>
  );
}
