"use client";

import { Box } from "@mui/material";
import type { StudentAccountStatus, StudentDirectoryRow, StudentEnrollmentStatus } from "../types";
import { StudentDirectoryCard } from "./StudentDirectoryCard";

interface StudentDirectoryCardListLabels {
  readonly weeklyHours: string;
  readonly enrollmentStatus: string;
  readonly classesLeft: string;
  readonly viewProfile: string;
  readonly statusLabels: Record<StudentAccountStatus, string>;
  readonly enrollmentLabels: Record<StudentEnrollmentStatus, string>;
}

interface StudentDirectoryCardListProps {
  readonly rows: readonly StudentDirectoryRow[];
  readonly labels: StudentDirectoryCardListLabels;
  readonly onViewProfile: (id: string) => void;
}

export function StudentDirectoryCardList({ rows, labels, onViewProfile }: StudentDirectoryCardListProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {rows.map(row => (
        <StudentDirectoryCard key={row.id} row={row} labels={labels} onViewProfile={onViewProfile} />
      ))}
    </Box>
  );
}
