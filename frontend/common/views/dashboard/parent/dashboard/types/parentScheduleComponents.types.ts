// NEW FOR PLAN v5: Lifted tier-paired Props out of mobile/desktop per specs.md §4.3
// (Class C — card-list vs data-grid pair). The shared row + base shape lives here;
// the mobile and desktop tier interfaces extend the base, adding layout-specific
// extras via `// VARIANT JUSTIFICATION: extra field <name>` comments.

import type { ParentDashboardLabels } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardLabels";
import type { ParentScheduleRow } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import type { SchedulePagination } from "@/frontend/common/views/dashboard/parent/dashboard/useParentDashboardViewModel";
import type {
  AssociatedStudentRow,
  AssociatedStudentsSectionLabels,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";

interface BaseParentScheduleListProps {
  readonly rows: readonly ParentScheduleRow[];
  readonly labels: ParentDashboardLabels;
  readonly pagination?: SchedulePagination;
}

// VARIANT JUSTIFICATION: extra field pageCount — the mobile list renders its own
// MobilePaginationControls and needs the page-count derived value to decide
// whether to show them; the desktop datagrid delegates pagination to MUI X
// Grid internals and computes the same value from `pagination`.
export interface ParentScheduleListMobileProps extends BaseParentScheduleListProps {
  readonly pageCount: number;
}

// VARIANT JUSTIFICATION: extra field onHistory — the desktop data-grid renders a
// dedicated "history" icon column per row; the mobile card list surfaces the
// history affordance via row-level actions on the schedule card primitive
// (no per-row history icon column rendered).
export interface ParentScheduleDataGridDesktopProps extends BaseParentScheduleListProps {
  readonly onHistory: (id: string) => void;
}

export interface BaseAssociatedStudentsListProps {
  readonly rows: readonly AssociatedStudentRow[];
  readonly labels: AssociatedStudentsSectionLabels;
}

// VARIANT JUSTIFICATION: extra field loading — the desktop data-grid renders a
// MUI X loading overlay from this flag; the mobile card list variant accepts
// loading separately and forwards it to MobileCardList's built-in loading state.
export interface AssociatedStudentsDataGridDesktopProps extends BaseAssociatedStudentsListProps {
  readonly loading?: boolean;
  readonly emptyMessage: string;
}
