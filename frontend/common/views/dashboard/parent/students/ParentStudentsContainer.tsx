"use client";

import { useQuery } from "@apollo/client/react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { parentAssignedStudentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { ParentStudentsView } from "@/frontend/common/views/dashboard/parent/students/parentStudentsView";
import { useAppTranslation } from "@/shared/locale";

export function ParentStudentsContainer() {
  const t = useAppTranslation().dashboardTranslations.parentStudents;
  const { data, loading, error } = useQuery(parentAssignedStudentsQueryDocument);

  const rows =
    data?.parentAssignedStudents?.rows?.map(row => ({
      id: row?.id ?? "",
      name: row?.name ?? "",
      status: row?.status ?? "",
      teacherName: row?.teacherName ?? null,
      classesRemaining: row?.classesRemaining ?? null,
      classesTotal: row?.classesTotal ?? null,
      hoursPerWeek: row?.hoursPerWeek ?? null,
    })) ?? [];

  return (
    <RequirePermission permissions={[AppPermission.ParentViewStudents]}>
      <ParentStudentsView labels={t} loading={loading} error={Boolean(error)} rows={rows} />
    </RequirePermission>
  );
}
