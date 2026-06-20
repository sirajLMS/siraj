"use client";

import { useQuery } from "@apollo/client/react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { teacherDirectoryQueryDocument } from "@/frontend/graphql/sharedDocuments/staff-directory.documents";
import { useTeacherDirectoryStore } from "@/frontend/stores/teacherDirectoryStore";
import { TeachersView } from "./TeachersView";

export function TeachersContainer() {
  const { searchQuery, setSearchQuery } = useTeacherDirectoryStore();

  const { data, loading } = useQuery(teacherDirectoryQueryDocument, {
    variables: { search: searchQuery || null, limit: 100, offset: 0 },
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
      />
    );
  }

  return (
    <RequirePermission permissions={[AppPermission.StaffViewDirectory]}>
      <TeachersView
        metrics={directory.metrics}
        rows={directory.rows || []}
        totalTeachers={directory.totalTeachers || 0}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
    </RequirePermission>
  );
}
