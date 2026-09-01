"use client";

import { Box, Link, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ComponentType } from "react";
import { PrimaryPageAction } from "@/frontend/common/components/ui/button";
import type { MeetingJoinActionProps } from "@/frontend/common/components/ui/display/meetingConfig/types";
import { studentHref } from "@/frontend/common/utils/profileHref";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { ScheduleInstanceStatusBadge } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleInstanceStatusBadge";
import {
  formatClassSchedule,
  isRowJoinable,
  type TeacherClassListViewModel,
} from "@/frontend/common/views/dashboard/teachers/classes/useTeacherClassListViewModel";

/**
 * Shared columns/card contract for the teacher class list.
 *
 * The desktop tier builds `GridColDef`s via `buildTeacherClassListColumns`
 * (`teacherClassListColumns.tsx`) and renders `DesktopAppDataGrid`; the mobile
 * tier renders {@link TeacherClassListCardContent} inside `MobileCardListItem`.
 * Both tiers inject their own action components (meeting join + class audit)
 * through {@link TeacherClassListActionSlots} so the contract stays tier-agnostic.
 */

export type TeacherClassRow = TeacherClassListViewModel["rows"][number];
type TeacherClassListLabels = TeacherClassListViewModel["labels"];

interface TeacherClassSessionActionLabels {
  readonly joinSession: string;
  readonly leaveClass: string;
  readonly leaveDisabledReason: string;
  readonly viewClassAudit: string;
  readonly contactAdmin: string;
}

interface ClassSessionActionButtonSlotProps {
  readonly action: "view_class_audit";
  readonly classId: string;
  readonly labels: TeacherClassSessionActionLabels;
  readonly onLeave: (id: string) => void;
  readonly onViewClassAudit: (id: string) => void;
  readonly fullWidth?: boolean;
}

interface TeacherClassPersonProfileLinkSlotProps {
  readonly href: string | undefined;
  readonly name: string;
}

export interface TeacherClassListActionSlots {
  readonly MeetingJoinAction: ComponentType<Readonly<MeetingJoinActionProps>>;
  readonly ClassSessionActionButton: ComponentType<Readonly<ClassSessionActionButtonSlotProps>>;
  readonly PersonProfileLink: ComponentType<Readonly<TeacherClassPersonProfileLinkSlotProps>>;
}

export interface TeacherClassListCellProps {
  readonly row: TeacherClassRow;
  readonly labels: TeacherClassListLabels;
  readonly locale: string;
  readonly onViewClassAudit: (id: string) => void;
  readonly slots: TeacherClassListActionSlots;
}

/** Student name cell with avatar + profile link, rendered through the tier slot. */
export function TeacherClassStudentLink({ row, slots }: Readonly<Pick<TeacherClassListCellProps, "row" | "slots">>) {
  return (
    <slots.PersonProfileLink
      href={row.studentId ? studentHref(row.studentId) : undefined}
      name={row.studentName ?? ""}
    />
  );
}

export function TeacherClassSchedule({ row, locale }: Readonly<Pick<TeacherClassListCellProps, "row" | "locale">>) {
  return (
    <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
      {formatClassSchedule(row.scheduledStartAt, row.scheduledEndAt, locale)}
    </Typography>
  );
}

export function TeacherClassStatusSummary({
  row,
  labels,
}: Readonly<Pick<TeacherClassListCellProps, "row" | "labels">>) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
      {row.durationMinutes ? (
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {labels.durationMinutes(row.durationMinutes)}
        </Typography>
      ) : null}
      <ScheduleInstanceStatusBadge
        executionState={row.executionState}
        outcome={row.outcome}
        scheduledStartAt={row.scheduledStartAt}
        scheduledEndAt={row.scheduledEndAt}
        durationMinutes={row.durationMinutes}
        statusLabels={labels.statusLabels}
        size="small"
      />
    </Box>
  );
}

/** Join action for joinable rows, audit action otherwise, plus the details link. */
export function TeacherClassRowActions({
  row,
  labels,
  onViewClassAudit,
  slots,
}: Readonly<Omit<TeacherClassListCellProps, "locale">>) {
  const classId = row.id ?? "";
  return (
    <>
      {isRowJoinable(row) ? (
        <slots.MeetingJoinAction
          variant="icon"
          joinUrl={row.meetingJoinUrl}
          meeting={row.effectiveMeeting}
          emptyRole="teacher"
          label={labels.joinVideo}
          setupHref="/profile?tab=meeting"
        />
      ) : (
        <slots.ClassSessionActionButton
          action="view_class_audit"
          classId={classId}
          labels={{
            joinSession: "",
            leaveClass: "",
            leaveDisabledReason: "",
            viewClassAudit: labels.viewClassAudit,
            contactAdmin: "",
          }}
          onLeave={() => {}}
          onViewClassAudit={onViewClassAudit}
        />
      )}
      <Link href={`/classes/${classId}`} style={{ textDecoration: "none" }}>
        <PrimaryPageAction size="small">{labels.viewDetails}</PrimaryPageAction>
      </Link>
    </>
  );
}

/** Inner content of one mobile card (rendered inside `MobileCardListItem`). */
export function TeacherClassListCardContent({
  row,
  labels,
  locale,
  onViewClassAudit,
  slots,
}: Readonly<TeacherClassListCellProps>) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <TeacherClassStudentLink row={row} slots={slots} />
      <TeacherClassSchedule row={row} locale={locale} />
      <Box sx={{ mt: 0.5 }}>
        <TeacherClassStatusSummary row={row} labels={labels} />
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
        <TeacherClassRowActions row={row} labels={labels} onViewClassAudit={onViewClassAudit} slots={slots} />
      </Box>
    </Box>
  );
}

/** Shared load-failure line rendered instead of the list on either tier. */
export function TeacherClassListErrorNotice({ message, sx }: Readonly<{ message: string; sx?: SxProps<Theme> }>) {
  return <Typography sx={mergeSx({ color: theme => theme.palette.error.main }, sx)}>{message}</Typography>;
}
