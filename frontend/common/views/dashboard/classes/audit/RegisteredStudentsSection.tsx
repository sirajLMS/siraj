"use client";

import { FileDownloadOutlined, VisibilityOutlined } from "@mui/icons-material";
import { IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { ExportButton, PersonProfileLinkCell, SectionPanel, StatusBadge } from "@/frontend/common/components/ui";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import type { GroupClassStudent } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { GroupClassAttendanceStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { studentHref } from "@/frontend/common/utils/profileHref";

interface RegisteredStudentsSectionProps {
  readonly students: readonly (GroupClassStudent | null)[] | null | undefined;
  readonly registeredCount: number;
  readonly labels: {
    readonly title: string;
    readonly exportList: string;
    readonly studentName: string;
    readonly idNumber: string;
    readonly attendanceStatus: string;
    readonly actions: string;
    readonly pending: string;
    readonly present: string;
    readonly absent: string;
    readonly noEntries: string;
  };
  readonly onExport: () => void;
  readonly onViewStudent: (id: string) => void;
}

const StyledStudentIdText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
}));

const StyledViewActionButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

type AttendanceStatus = "pending" | "present" | "absent";

const ATTENDANCE_STATUS_MAP: Record<GroupClassAttendanceStatus, AttendanceStatus> = {
  [GroupClassAttendanceStatus.Pending]: "pending",
  [GroupClassAttendanceStatus.Present]: "present",
  [GroupClassAttendanceStatus.Absent]: "absent",
  [GroupClassAttendanceStatus.Late]: "pending",
};

function getAttendanceChipProps(
  status: GroupClassAttendanceStatus | null | undefined,
  labels: RegisteredStudentsSectionProps["labels"]
): { label: string } {
  if (status === GroupClassAttendanceStatus.Present) {
    return { label: labels.present };
  }
  if (status === GroupClassAttendanceStatus.Absent) {
    return { label: labels.absent };
  }
  return { label: labels.pending };
}

export function RegisteredStudentsSection({
  students,
  registeredCount,
  labels,
  onExport,
  onViewStudent,
}: RegisteredStudentsSectionProps) {
  const title = labels.title.replace("{count}", String(registeredCount));

  const validStudents = useMemo(() => (students ?? []).filter((s): s is GroupClassStudent => s != null), [students]);

  const columns = useMemo<GridColDef<GroupClassStudent>[]>(
    () => [
      {
        field: "name",
        headerName: labels.studentName,
        flex: 1.2,
        minWidth: 200,
        renderCell: ({ row }) => (
          <PersonProfileLinkCell
            href={row.id ? studentHref(row.id) : undefined}
            name={row.name ?? ""}
            avatarUrl={row.avatarUrl}
            showAvatar
            avatarSize={32}
            fallbackInitial={row.initials?.[0] ?? "?"}
            typographyVariant="bodyMd"
            fontWeight={500}
          />
        ),
      },
      {
        field: "studentId",
        headerName: labels.idNumber,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => <StyledStudentIdText variant="bodyMd">{row.studentId ?? ""}</StyledStudentIdText>,
      },
      {
        field: "attendanceStatus",
        headerName: labels.attendanceStatus,
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => {
          const attendanceDisplay = row.attendanceStatus ? ATTENDANCE_STATUS_MAP[row.attendanceStatus] : "pending";
          const chip = getAttendanceChipProps(row.attendanceStatus, labels);
          return <StatusBadge category="sessionTracking" status={attendanceDisplay} label={chip.label} />;
        },
      },
      {
        field: "actions",
        headerName: labels.actions,
        width: 100,
        sortable: false,
        align: "right",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <StyledViewActionButton
            size="small"
            onClick={() => {
              if (row.id) {
                onViewStudent(row.id);
              }
            }}
            aria-label={`View ${row.name ?? ""}`}
          >
            <VisibilityOutlined fontSize="small" />
          </StyledViewActionButton>
        ),
      },
    ],
    [labels, onViewStudent]
  );

  return (
    <SectionPanel
      title={title}
      actions={
        <ExportButton id="schedule-alerts-export" startIcon={<FileDownloadOutlined />} onClick={onExport}>
          {labels.exportList}
        </ExportButton>
      }
    >
      <AppDataGrid<GroupClassStudent>
        rows={validStudents}
        columns={columns}
        getRowId={row => row.id ?? ""}
        autoHeight
        paginationOptions={{ mode: "client" }}
        ariaLabel="registered-students-table"
        emptyMessage={labels.noEntries}
        rowHeight={80}
      />
    </SectionPanel>
  );
}
