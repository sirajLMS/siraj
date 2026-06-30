"use client";

import { useQuery } from "@apollo/client/react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import type { TeacherDirectoryRow } from "@/frontend/graphql/generated/gql/graphql-types";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { teacherDirectoryQueryDocument } from "@/frontend/graphql/sharedDocuments/staff-directory.documents";
import { useTeacherDirectoryStore } from "@/frontend/stores/teacherDirectoryStore";
import { TeachersView } from "./TeachersView";

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
        rows={(directory.rows || []) as unknown as readonly TeacherDirectoryRow[]}
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
