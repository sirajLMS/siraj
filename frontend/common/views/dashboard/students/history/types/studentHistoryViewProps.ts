import type { ClassSession } from "@/frontend/common/views/dashboard/students/history/types";

import type { StudentHistoryMetrics } from "@/frontend/common/views/dashboard/students/history/types/studentHistoryTypes";

export interface StudentHistoryViewProps {
  readonly studentName: string;
  readonly currentMonth: Date;
  readonly metrics: StudentHistoryMetrics;
  readonly classes: Readonly<Partial<Record<number, ClassSession>>>;
  readonly selectedWeek: number;
  readonly selectedDay: number | null;
  readonly embedded?: boolean;
  readonly onSelectWeek: (week: number) => void;
  readonly onSelectDay: (day: number | null) => void;
  readonly onPrevMonth: () => void;
  readonly onNextMonth: () => void;
  readonly onPrint: () => void;
  readonly enrollmentMonth?: Date;
  readonly nowMonth?: Date;
  readonly locale: string;
}
