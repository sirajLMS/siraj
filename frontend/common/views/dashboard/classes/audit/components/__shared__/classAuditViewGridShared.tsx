"use client";

import { Grid } from "@mui/material";
import type { ComponentType } from "react";
import { ClassAuditDetailsCard } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditDetailsCard";
import type {
  ClassAuditViewProps,
  MeetingInfoLabels,
} from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import { ClassAuditGrid } from "@/frontend/common/views/dashboard/classes/audit/components/classAuditGrid";
import type { ClassAuditGridSlotProps } from "@/frontend/common/views/dashboard/classes/audit/types/classAuditGridShared.types";
import { buildDetailsLabels } from "@/frontend/common/views/dashboard/classes/audit/utils";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

export interface ClassAuditViewGridSlotConfig {
  readonly OnlineMeetingCard: ComponentType<{
    readonly meetingInfo: ComponentProps["meetingInfo"];
    readonly labels: MeetingInfoLabels;
    readonly showJoin: boolean;
  }>;
  readonly gridSlots: ClassAuditGridSlotProps;
}

type ComponentProps = {
  readonly meetingInfo: NonNullable<ClassAuditViewProps["audit"]>["meetingInfo"];
};

export function ClassAuditViewGridShared({
  audit,
  labels,
  onResendNotifications,
  isResending,
  onExportStudents,
  onViewStudent,
  onUpdateAdminNote,
  onEditAdminNote,
  slots,
}: Readonly<
  Pick<
    ClassAuditViewProps,
    | "audit"
    | "labels"
    | "onResendNotifications"
    | "isResending"
    | "onExportStudents"
    | "onViewStudent"
    | "onUpdateAdminNote"
    | "onEditAdminNote"
  > & { readonly slots: ClassAuditViewGridSlotConfig }
>) {
  const detailsLabels = buildDetailsLabels(labels);
  const { OnlineMeetingCard, gridSlots } = slots;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }} sx={{ order: { xs: 1, lg: 1 } }}>
        <ClassAuditDetailsCard audit={audit} labels={detailsLabels} />
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }} sx={{ order: { xs: 2, lg: 2 } }}>
        <OnlineMeetingCard
          meetingInfo={audit.meetingInfo}
          labels={labels.meetingInfo}
          showJoin={isJoinableClassInstance(audit.status, audit.outcome, { isFrozen: audit.isFrozen ?? false })}
        />
      </Grid>

      <ClassAuditGrid
        communications={audit.communications}
        communicationLogLabels={labels.communicationLog}
        onResendNotifications={onResendNotifications}
        isResending={isResending}
        students={audit.students}
        registeredStudentCount={audit.registeredStudentCount ?? 0}
        registeredStudentsLabels={labels.registeredStudents}
        onExportStudents={onExportStudents}
        onViewStudent={onViewStudent}
        adminNote={audit.adminNote}
        adminNoteLabels={labels.adminNote}
        onUpdateAdminNote={onUpdateAdminNote}
        onEditAdminNote={onEditAdminNote}
        slots={gridSlots}
      />
    </Grid>
  );
}
