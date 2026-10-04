import type {
  TeacherAvailabilityGapItem,
  TeacherAvailabilityMonthDrawerProps,
} from "@/frontend/common/views/dashboard/search-schedule/types";
import type { SearchScheduleLabels } from "@/shared/locale/types/dashboard/core/searchSchedule";

export interface TeacherAvailabilityMonthDrawerSlotProps {
  /** Tier-specific calendar grid component (desktop or mobile). */
  readonly CalendarGridComponent: React.FC<{
    readonly labels: SearchScheduleLabels;
    readonly currentMonth: Date;
    readonly daysByDate: Readonly<Partial<Record<number, readonly TeacherAvailabilityGapItem[]>>>;
  }>;
  /** Drawer anchor position — "right" for desktop, "bottom" for mobile. */
  readonly drawerAnchor: "right" | "bottom";
  /** Drawer paper sx — tier-specific width/maxWidth/borderRadius. */
  readonly drawerPaperSx: Record<string, unknown>;
}

export type TeacherAvailabilityMonthDrawerSharedProps = TeacherAvailabilityMonthDrawerProps &
  TeacherAvailabilityMonthDrawerSlotProps;
