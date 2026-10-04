import type { AcademicClassRow, ClassSessionStatus } from "@/frontend/common/views/dashboard/schedule/alerts/types";

export interface AcademicScheduleDataGridDesktopLabels {
  readonly className: string;
  readonly instructor: string;
  readonly time: string;
  readonly room: string;
  readonly status: string;
  readonly joinSession: string;
  readonly leaveClass: string;
  readonly leaveDisabledReason: string;
  readonly viewClassAudit: string;
  readonly contactAdmin: string;
  readonly active: string;
  readonly upcoming: string;
  readonly missed: string;
  readonly hold: string;
  readonly noEntries: string;
}

export interface AcademicScheduleDataGridDesktopProps {
  readonly rows: readonly AcademicClassRow[];
  readonly labels: AcademicScheduleDataGridDesktopLabels;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalClasses?: number;
  readonly onLeave: (id: string) => void;
  readonly onViewClassAudit: (id: string) => void;
  readonly onPageChange?: (page: number) => void;
  readonly loading?: boolean;
}

export type SessionStatusLabels = Record<ClassSessionStatus, keyof AcademicScheduleDataGridDesktopLabels>;
