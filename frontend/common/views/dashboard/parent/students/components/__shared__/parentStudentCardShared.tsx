import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { studentHref } from "@/frontend/common/utils/profileHref";
import { ClassesLeftProgress } from "@/frontend/common/views/dashboard/admin/parents/students/components/ClassesLeftProgress";
import {
  formatHours,
  labelSx,
  valueSx,
} from "@/frontend/common/views/dashboard/admin/parents/students/utils/studentDirectoryCardFormat";
import type { ParentStudentCardLabels } from "@/frontend/common/views/dashboard/parent/students/types/parentStudentCard.types";
import type { ParentStudentRow } from "@/frontend/common/views/dashboard/parent/students/useParentStudentsViewModel";

export interface ParentStudentCardSharedOptions {
  readonly topGap: number;
  readonly renderContainer: (children: ReactNode, row: ParentStudentRow) => ReactNode;
  readonly renderProfileLink: (row: ParentStudentRow, href: string | undefined) => ReactNode;
  readonly renderStatusBadge: (row: ParentStudentRow, labels: ParentStudentCardLabels) => ReactNode;
}

export interface ParentStudentCardSharedProps {
  readonly row: ParentStudentRow;
  readonly labels: ParentStudentCardLabels;
  readonly options: ParentStudentCardSharedOptions;
}

export function ParentStudentCardShared({ row, labels, options }: Readonly<ParentStudentCardSharedProps>): ReactNode {
  const href = row.id ? studentHref(row.id) : undefined;

  const content = (
    <>
      <Box
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, gap: options.topGap }}
      >
        {options.renderProfileLink(row, href)}
        {options.renderStatusBadge(row, labels)}
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
    </>
  );

  return options.renderContainer(content, row);
}
