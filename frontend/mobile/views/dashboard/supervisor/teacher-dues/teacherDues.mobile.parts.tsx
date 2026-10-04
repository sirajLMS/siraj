"use client";

import { Box, Checkbox, Stack, Typography } from "@mui/material";
import { RateSource, TeacherDueStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type {
  TeacherDueRow,
  TeacherDuesViewModel,
} from "@/frontend/common/views/dashboard/supervisor/teacher-dues/types/teacherDuesTypes";
import { MobileCardListItem, MobilePrimaryPageAction, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display/personProfileLink";

function rateSourceLabel(
  source: RateSource | null,
  labels: Pick<
    TeacherDuesViewModel["labels"],
    "rateSourceOverride" | "rateSourceRecurring" | "rateSourceSubject" | "rateSourceTeacher"
  >
): string {
  switch (source) {
    case RateSource.Override:
      return labels.rateSourceOverride;
    case RateSource.Recurring:
      return labels.rateSourceRecurring;
    case RateSource.Subject:
      return labels.rateSourceSubject;
    case RateSource.Teacher:
      return labels.rateSourceTeacher;
    default:
      return labels.rateSourceTeacher;
  }
}

function DueCard({
  row,
  labels,
  selected,
  markingPaid,
  canMarkPaid,
  onToggle,
  onMarkPaid,
}: Readonly<{
  readonly row: TeacherDueRow;
  readonly labels: TeacherDuesViewModel["labels"];
  readonly selected: boolean;
  readonly markingPaid: boolean;
  readonly canMarkPaid: boolean;
  readonly onToggle: (id: string) => void;
  readonly onMarkPaid: (ids: string[]) => void;
}>) {
  return (
    <MobileCardListItem variant="edge-to-edge">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
          {canMarkPaid && <Checkbox checked={selected} onChange={() => onToggle(row.id)} size="small" />}
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.75 }}>
            <MobilePersonProfileLink
              href={profileHrefForTeacher({ userId: row.teacherUserId, teacherId: row.teacherId })}
              name={row.teacherName || row.teacherId}
              avatarUrl={row.teacherAvatarUrl}
            />
            <MobilePersonProfileLink
              href={row.studentId ? studentHref(row.studentId) : undefined}
              name={row.studentName || row.studentId}
              avatarUrl={row.studentAvatarUrl}
              label={labels.studentColumn}
            />
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {labels.classDateColumn}: {row.classDate || "-"}
            </Typography>
          </Box>
          <MobileStatusBadge
            category="invoice"
            status={row.status ?? "PENDING"}
            label={row.status === TeacherDueStatus.Paid ? labels.statusPaid : labels.statusPending}
          />{" "}
        </Stack>

        <Stack sx={{ flexDirection: "row", justifyContent: "space-between", gap: 1 }}>
          <Box>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {labels.hoursColumn}
            </Typography>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface })}>
              {row.hours}
            </Typography>
          </Box>
          <Box>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {labels.amountColumn}
            </Typography>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface })}>
              {row.currency} {row.amount}
            </Typography>
          </Box>
          <Box>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {labels.approvedDateColumn}
            </Typography>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface })}>
              {row.approvedAt || "-"}
            </Typography>
          </Box>
          <Box>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {labels.rateSourceColumn}
            </Typography>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface })}>
              {rateSourceLabel(row.rateSource, labels)}
            </Typography>
          </Box>
        </Stack>

        {canMarkPaid && (
          <MobilePrimaryPageAction
            size="small"
            onClick={() => onMarkPaid([row.id])}
            disabled={markingPaid}
            sx={{ alignSelf: "flex-start" }}
          >
            {labels.markAsPaidButton}
          </MobilePrimaryPageAction>
        )}
      </Box>
    </MobileCardListItem>
  );
}

export { DueCard };
