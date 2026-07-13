"use client";

import { useQuery } from "@apollo/client/react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { teacherDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useTeacherDirectoryStore } from "@/frontend/common/stores/teacherDirectoryStore";
import { TeachersView } from "@/frontend/views/dashboard/teachers/home/TeachersView";

export function TeachersContainer() {
  const { searchQuery, setSearchQuery, page, pageSize, setPage } = useTeacherDirectoryStore();

  const { data, loading } = useQuery(teacherDirectoryQueryDocument, {
    variables: {
      search: searchQuery || null,
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

  const directory = data?.teacherDirectory;

  if (loading || !directory) {
    return (
      <TeachersView
        metrics={{ id: "loading-metrics-id", activated: 0, deactivated: 0 }}
        rows={[]}
        totalTeachers={0}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        page={page}
        pageSize={pageSize}
        totalCount={0}
        onPageChange={setPage}
      />
    );
  }

  return (
    <RequirePermission permissions={[AppPermission.StaffViewDirectory]}>
      <TeachersView
        metrics={directory.metrics}
        rows={directory.rows ?? []}
        totalTeachers={directory.totalTeachers || 0}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        page={page}
        pageSize={pageSize}
        totalCount={directory.pageInfo?.total ?? 0}
        onPageChange={setPage}
      />
    </RequirePermission>
  );
}
