"use client";

import { Box, Grid } from "@mui/material";
import type {
  AdminNoteInfo,
  CommunicationLogEntry,
  GroupClassStudent,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  AdminNoteLabels,
  CommunicationLogLabels,
} from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import { RegisteredStudentsSection } from "@/frontend/common/views/dashboard/classes/audit/RegisteredStudentsSection";
import type { ClassAuditGridSlotProps } from "@/frontend/common/views/dashboard/classes/audit/types/classAuditGridShared.types";

/**
 * Props for {@link ClassAuditGrid}.
 *
 * Carries the audit data slices consumed by the three lower grid segments
 * (communication log entries / registered students / admin note) together with
 * their handlers and labels, plus the tier-supplied slot components.
 */
export interface ClassAuditGridProps {
  readonly communications: readonly (CommunicationLogEntry | null)[] | null | undefined;
  readonly communicationLogLabels: CommunicationLogLabels;
  readonly onResendNotifications: () => void;
  readonly isResending: boolean;

  readonly students: readonly (GroupClassStudent | null)[] | null | undefined;
  readonly registeredStudentCount: number;
  readonly registeredStudentsLabels: {
    readonly title: string;
    readonly exportList: string;
    readonly studentName: string;
    readonly idNumber: string;
    readonly attendanceStatus: string;
    readonly actions: string;
    readonly student: string;
    readonly status: string;
    readonly viewAll: string;
    readonly pending: string;
    readonly present: string;
    readonly absent: string;
    readonly noEntries: string;
  };
  readonly onExportStudents: () => void;
  readonly onViewStudent: (id: string) => void;

  readonly adminNote: AdminNoteInfo | null | undefined;
  readonly adminNoteLabels: AdminNoteLabels;
  readonly onUpdateAdminNote: () => void;
  /** Required — desktop slot ignores this; mobile slot renders an Edit button. */
  readonly onEditAdminNote: () => void;

  readonly slots: ClassAuditGridSlotProps;
}

/**
 * ClassAuditGrid — the three lower `<Grid>` segments shared between the desktop
 * and mobile `ClassAuditView` variants: communication log card (lg:4, order 3),
 * registered students section (lg:8, order 4), and admin note card (lg:4,
 * order 5). Lifted out to satisfy the SonarQube duplication cluster flagged on
 * the byte-identical grid scaffolding + ordering between the two tier files.
 *
 * The mobile caller passes an `AdminNoteCard` slot that accepts `onEdit` and a
 * non-undefined `onEditAdminNote`; desktop passes a slot without `onEdit`. The
 * `onEdit` is only forwarded when present so the desktop slot (which does not
 * declare `onEdit`) still type-checks.
 */
export function ClassAuditGrid({
  communications,
  communicationLogLabels,
  onResendNotifications,
  isResending,
  students,
  registeredStudentCount,
  registeredStudentsLabels,
  onExportStudents,
  onViewStudent,
  adminNote,
  adminNoteLabels,
  onUpdateAdminNote,
  onEditAdminNote,
  slots,
}: Readonly<ClassAuditGridProps>) {
  const { CommunicationLogCard, AdminNoteCard } = slots;

  return (
    <>
      <Grid size={{ xs: 12, lg: 4 }} sx={{ order: { xs: 3, lg: 4 } }}>
        <Box sx={{ mt: { lg: 0 } }}>
          <CommunicationLogCard
            entries={communications}
            labels={communicationLogLabels}
            onResend={onResendNotifications}
            isResending={isResending}
          />
        </Box>
      </Grid>

      <Grid size={{ xs: 12, lg: 8 }} sx={{ order: { xs: 4, lg: 3 } }}>
        <RegisteredStudentsSection
          students={students}
          registeredCount={registeredStudentCount}
          labels={registeredStudentsLabels}
          onExport={onExportStudents}
          onViewStudent={onViewStudent}
        />
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }} sx={{ order: { xs: 5, lg: 5 } }}>
        <AdminNoteCard
          note={adminNote}
          labels={adminNoteLabels}
          onUpdate={onUpdateAdminNote}
          onEdit={onEditAdminNote}
        />
      </Grid>
    </>
  );
}
