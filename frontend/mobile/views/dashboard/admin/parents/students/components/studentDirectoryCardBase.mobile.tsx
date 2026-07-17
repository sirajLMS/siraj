"use client";

import { Card } from "@mui/material";
import type {
  StudentDirectoryCardLabels,
  StudentDirectoryRowExtended,
} from "@/frontend/common/views/dashboard/admin/parents/students/types";
import { StudentDirectoryCardFooter } from "@/frontend/mobile/views/dashboard/admin/parents/students/components/studentDirectoryCardFooter.mobile";
import { StudentDirectoryCardHeader } from "@/frontend/mobile/views/dashboard/admin/parents/students/components/studentDirectoryCardHeader.mobile";
import { StudentDirectoryCardStats } from "@/frontend/mobile/views/dashboard/admin/parents/students/components/studentDirectoryCardStats.mobile";

interface StudentDirectoryCardBaseProps {
  readonly row: StudentDirectoryRowExtended;
  readonly labels: StudentDirectoryCardLabels;
  readonly onViewProfile: (id: string) => void;
}

export function StudentDirectoryCardBase({ row, labels, onViewProfile }: Readonly<StudentDirectoryCardBaseProps>) {
  return (
    <Card
      elevation={0}
      onClick={() => {
        onViewProfile(row.id ?? "");
      }}
      sx={theme => ({
        p: 2,
        borderRadius: 3,
        border: `1px solid ${theme.palette.border.light}`,
        backgroundColor: theme.palette.background.paper,
        opacity: row.isDeactivated ? 0.8 : 1,
        cursor: "pointer",
        transition: "box-shadow 0.15s ease",
        "&:active": { transform: "scale(0.98)" },
      })}
    >
      <StudentDirectoryCardHeader row={row} statusLabels={labels.statusLabels} />
      <StudentDirectoryCardStats
        row={row}
        weeklyHoursLabel={labels.weeklyHours}
        enrollmentStatusLabel={labels.enrollmentStatus}
        enrollmentLabels={labels.enrollmentLabels}
      />
      <StudentDirectoryCardFooter
        row={row}
        classesLeftLabel={labels.classesLeft}
        viewProfileLabel={labels.viewProfile}
        onViewProfile={onViewProfile}
      />
    </Card>
  );
}
