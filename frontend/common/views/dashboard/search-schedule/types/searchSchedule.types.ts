import type { AvailabilitySearchSortBy } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  SearchScheduleDraftFilters,
  SearchScheduleTeacherOption,
} from "@/frontend/common/stores/searchScheduleStore";
import type {
  SearchSchedulePageInfo,
  SearchScheduleResultItem,
} from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel";

// Shared tier-agnostic gap row shape used by day-pill, calendar-grid, and month-drawer.
export interface TeacherAvailabilityGapItem {
  readonly id?: string | null;
  readonly calendarDate?: string | null;
  readonly gapStartTime?: string | null;
  readonly gapEndTime?: string | null;
}

// Class-B unified: byte-identical mobile/desktop interfaces — per specs.md §4.1.
export interface SearchScheduleFormProps {
  readonly draft: SearchScheduleDraftFilters;
  readonly isSearching: boolean;
  readonly onDraftChange: (draft: Partial<SearchScheduleDraftFilters>) => void;
  readonly onSearch: () => void;
  readonly formFilterDrawerOpen: boolean;
  readonly onOpenFormFilterDrawer: () => void;
  readonly onCloseFormFilterDrawer: () => void;
  readonly sortMenuAnchorEl: HTMLElement | null;
  readonly onSortMenuOpen: (event: { currentTarget: HTMLElement }) => void;
  readonly onSortMenuClose: () => void;
  readonly onSortChange: (sortBy: SearchScheduleDraftFilters["sortBy"]) => void;
  readonly selectedTeacher: SearchScheduleTeacherOption | null;
  readonly onSelectTeacher: (teacher: SearchScheduleTeacherOption | null) => void;
}

// Class-B unified: byte-identical mobile/desktop interfaces — per specs.md §4.1.
export interface SearchScheduleSortMenuProps {
  readonly sortBy: SearchScheduleDraftFilters["sortBy"];
  readonly sortMenuAnchorEl: HTMLElement | null;
  readonly onSortMenuOpen: (event: { currentTarget: HTMLElement }) => void;
  readonly onSortMenuClose: () => void;
  readonly onSortChange: (sortBy: AvailabilitySearchSortBy) => void;
}

// Class-B unified: byte-identical mobile/desktop interfaces — per specs.md §4.1.
export interface TeacherAvailabilityCalendarDay {
  readonly day: number;
  readonly gaps: readonly TeacherAvailabilityGapItem[];
}

// Class-B unified: byte-identical mobile/desktop interfaces — per specs.md §4.1.
export interface TeacherAvailabilityCalendarGridProps {
  readonly currentMonth: Date;
  readonly daysByDate: Readonly<Partial<Record<number, readonly TeacherAvailabilityGapItem[]>>>;
}

// Class-B unified: byte-identical mobile/desktop interfaces — per specs.md §4.1.
export interface SearchSchedulePaginationFooterProps {
  readonly pageInfo: SearchSchedulePageInfo;
  readonly teacherCount: number;
  readonly onPageChange: (page: number) => void;
}

// Class-B unified: byte-identical mobile/desktop interfaces — per specs.md §4.1.
export interface SearchScheduleResultsSkeletonProps {
  readonly columnCount: number;
  readonly cardCount?: number;
}

// Class-B unified: byte-identical mobile/desktop interfaces — per specs.md §4.1.
// The day-pill has no divergent fields between tiers; both render the same chip row.
export interface TeacherAvailabilityDayPillProps {
  readonly calendarDate: string;
  readonly gaps: readonly TeacherAvailabilityGapItem[];
}

// Class-B unified: byte-identical mobile/desktop interfaces — per specs.md §4.1.
// Both tiers receive the same VM-passed grid props (dateColumns + gapsByDate precomputed by the VM)
// and the same month-drawer open callback that routes through the unified VM month-drawer state.
export interface TeacherAvailabilityGridProps {
  readonly teacher: SearchScheduleResultItem;
  readonly fromDate: string;
  readonly dateColumns: readonly string[];
  readonly gapsByDate: ReadonlyMap<string, readonly TeacherAvailabilityGapItem[]>;
  readonly onOpenMonthDrawer: (teacher: SearchScheduleResultItem, anchorFromDate: string) => void;
}

// Class-B unified: byte-identical mobile/desktop interfaces — per specs.md §4.1.
// Both tiers receive the month-drawer VM state + navigation callbacks as plain props; the only
// tier divergence is Drawer anchor/width styling, which lives in the tier .tsx body, not the type.
export interface TeacherAvailabilityMonthDrawerProps {
  readonly open: boolean;
  readonly teacher: SearchScheduleResultItem | null;
  readonly currentMonth: Date;
  readonly monthDrawerLoading: boolean;
  readonly monthDrawerError: unknown;
  readonly daysByDate: Readonly<Partial<Record<number, readonly TeacherAvailabilityGapItem[]>>>;
  readonly onClose: () => void;
  readonly onMonthChange: (next: Date) => void;
}

export type SearchSchedulePageInfoRef = SearchSchedulePageInfo;
