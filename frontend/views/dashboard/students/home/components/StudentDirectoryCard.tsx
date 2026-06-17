"use client";

import { Card } from "@mui/material";
import type {
  StudentAccountStatus,
  StudentDirectoryRow,
  StudentEnrollmentStatus,
} from "@/frontend/stores/mockStudentsStore";
import { StudentDirectoryCardFooter } from "./StudentDirectoryCardFooter";
import { StudentDirectoryCardHeader } from "./StudentDirectoryCardHeader";
import { StudentDirectoryCardStats } from "./StudentDirectoryCardStats";

interface StudentDirectoryCardLabels {
  readonly weeklyHours: string;
  readonly enrollmentStatus: string;
  readonly classesLeft: string;
  readonly viewProfile: string;
  readonly statusLabels: Record<StudentAccountStatus, string>;
  readonly enrollmentLabels: Record<StudentEnrollmentStatus, string>;
}

interface StudentDirectoryCardProps {
  readonly row: StudentDirectoryRow;
  readonly labels: StudentDirectoryCardLabels;
  readonly onViewProfile: (id: string) => void;
}

export function StudentDirectoryCard({ row, labels, onViewProfile }: StudentDirectoryCardProps) {
  return (
    <Card
      elevation={0}
      onClick={() => {
        onViewProfile(row.id);
      }}
      sx={theme => ({
        p: 2,
        borderRadius: 3,
        border: `1px solid ${theme.palette.border.light}`,
        bgcolor: theme.palette.background.paper,
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
