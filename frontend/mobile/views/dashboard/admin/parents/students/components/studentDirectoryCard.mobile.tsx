"use client";

import type {
  StudentDirectoryCardLabels,
  StudentDirectoryRowExtended,
} from "@/frontend/common/views/dashboard/admin/parents/students/types";
import { MobileCardListItem } from "@/frontend/mobile/components/ui";
import { StudentDirectoryCardFooter } from "@/frontend/mobile/views/dashboard/admin/parents/students/components/studentDirectoryCardFooter.mobile";
import { StudentDirectoryCardHeader } from "@/frontend/mobile/views/dashboard/admin/parents/students/components/studentDirectoryCardHeader.mobile";
import { StudentDirectoryCardStats } from "@/frontend/mobile/views/dashboard/admin/parents/students/components/studentDirectoryCardStats.mobile";

export interface StudentDirectoryMobileCardProps {
  readonly row: StudentDirectoryRowExtended;
  readonly labels: StudentDirectoryCardLabels;
  readonly onViewProfile: (id: string) => void;
}

export function StudentDirectoryMobileCard({ row, labels, onViewProfile }: Readonly<StudentDirectoryMobileCardProps>) {
  return (
    <MobileCardListItem
      variant="edge-to-edge"
      interactive
      dimmed={row.isDeactivated ?? false}
      accentBorder={row.isDeactivated ? { color: "error", side: "inline-start" } : undefined}
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
    </MobileCardListItem>
  );
}
