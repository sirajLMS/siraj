"use client";

import { useQuery } from "@apollo/client/react";
import { Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type { ReactElement } from "react";
import { SectionPanel, StatusBadge } from "@/frontend/common/components/ui";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import type { TeacherAssignedStudentsQuery_teacherAssignedStudents_rows } from "@/frontend/common/graphql/generated/gql/graphql";
import { teacherAssignedStudentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/teachers";
import {
  QuotaEmptyState,
  QuotaLoadingSkeleton,
} from "@/frontend/common/views/dashboard/students/quota/audience/__shared__/quotaAudienceBalanceCard";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface TeacherQuotaViewProps {
  readonly t: StudentQuotaLabels;
}

type TeacherStudentRow = TeacherAssignedStudentsQuery_teacherAssignedStudents_rows;

function buildTeacherStudentColumns(t: StudentQuotaLabels): GridColDef<TeacherStudentRow>[] {
  return [
    {
      field: "name",
      headerName: t.audience.name,
      flex: 1.5,
      minWidth: 160,
      renderCell: params => (
        <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
          {params.value ?? t.common.notSet}
        </Typography>
      ),
    },
    {
      field: "classesRemaining",
      headerName: t.audience.remaining,
      type: "number",
      flex: 1.2,
      minWidth: 150,
      renderCell: params => (
        <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
          {t.audience.remainingOfTotal(params.row.classesRemaining ?? 0, params.row.classesTotal ?? 0)}
        </Typography>
      ),
    },
    {
      field: "eligibility",
      headerName: t.audience.status,
      flex: 1.2,
      minWidth: 180,
      sortable: false,
      filterable: false,
      renderCell: params => {
        const eligible = (params.row.classesRemaining ?? 0) > 0;
        return (
          <StatusBadge
            category="session"
            status={eligible ? "active" : "hold"}
            label={eligible ? t.audience.eligibleForNextClass : t.audience.notEligibleForNextClass}
            size="small"
            component="output"
          />
        );
      },
    },
  ];
}

export function TeacherQuotaView({ t }: Readonly<TeacherQuotaViewProps>): ReactElement {
  const { data, loading } = useQuery(teacherAssignedStudentsQueryDocument);
  const students = data?.teacherAssignedStudents?.rows ?? [];
  const columns = buildTeacherStudentColumns(t);

  if (loading) {
    return <QuotaLoadingSkeleton t={t} />;
  }

  if (students.length === 0) {
    return <QuotaEmptyState message={t.audience.noData} />;
  }

  return (
    <SectionPanel title={t.audience.teacherTitle}>
      <AppDataGrid
        rows={students}
        columns={columns}
        loading={loading}
        emptyMessage={t.audience.noData}
        ariaLabel={t.audience.teacherTitle}
        paginationOptions={{ mode: "client", pageSize: 10 }}
      />
    </SectionPanel>
  );
}
