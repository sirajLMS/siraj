"use client";

import { Box, Typography } from "@mui/material";
import { studentHref } from "@/frontend/common/utils/profileHref";
import { ClassesLeftProgress } from "@/frontend/common/views/dashboard/admin/parents/students/components/ClassesLeftProgress";
import {
  formatHours,
  labelSx,
  valueSx,
} from "@/frontend/common/views/dashboard/admin/parents/students/utils/studentDirectoryCardFormat";
import type { ParentStudentCardLabels } from "@/frontend/common/views/dashboard/parent/students/types/parentStudentCard.types";
import type { ParentStudentRow } from "@/frontend/common/views/dashboard/parent/students/useParentStudentsViewModel";
import { MobileCardListItem, MobilePersonProfileLink, MobileStatusBadge } from "@/frontend/mobile/components/ui";

export interface ParentStudentMobileCardProps {
  readonly row: ParentStudentRow;
  readonly labels: ParentStudentCardLabels;
}

export function ParentStudentMobileCard({ row, labels }: Readonly<ParentStudentMobileCardProps>) {
  return (
    <MobileCardListItem
      variant="edge-to-edge"
      dimmed={row.isDeactivated}
      accentBorder={row.isDeactivated ? { color: "error", side: "inline-start" } : undefined}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, gap: 1 }}>
        <MobilePersonProfileLink
          href={row.id ? studentHref(row.id) : undefined}
          name={row.name}
          avatarUrl={row.studentAvatarUrl}
          fallbackInitial="S"
          avatarSize={48}
          typographyVariant="bodyLg"
          fontWeight={700}
        />
        <MobileStatusBadge
          category="studentAccount"
          status={row.accountStatus}
          label={labels.statusLabels[row.accountStatus]}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography sx={labelSx}>{labels.weeklyHours}</Typography>
        <Typography sx={valueSx}>{formatHours(row.hoursPerWeek)}</Typography>
      </Box>

      <Box
        sx={theme => ({
          borderTop: `1px solid ${theme.palette.border.light}`,
          pt: 1.5,
        })}
      >
        <Typography
          sx={theme => ({
            typography: "labelUppercase",
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: theme.palette.text.secondary,
            mb: 0.5,
          })}
        >
          {labels.classesLeft}
        </Typography>
        <ClassesLeftProgress
          remaining={row.classesRemaining}
          total={row.classesTotal}
          accountStatus={row.accountStatus}
          compact
        />
      </Box>
    </MobileCardListItem>
  );
}
