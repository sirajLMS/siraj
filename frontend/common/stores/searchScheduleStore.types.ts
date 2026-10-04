import type {
  AvailabilitySearchInput,
  AvailabilitySearchSortBy,
  Gender,
  SearchTeacherAvailabilityQuery_searchTeacherAvailability_teachers,
  SearchTeacherAvailabilityQuery_searchTeacherAvailability_teachers_gaps,
} from "@/frontend/common/graphql/generated/gql/graphql";

export interface SearchScheduleTeacherOption {
  readonly id: string;
  readonly name: string;
}

// Minimal serializable shape for the month drawer's selected teacher. Mirrors the runtime subset
// of the availability result item (id + name + timezone + gender + availableDaysCount + gaps) so
// the drawer state survives viewport tier switches. Nullable to match the optional-null field
// shapes produced by the GraphQL layer.
export type SearchScheduleGapItem = Pick<
  SearchTeacherAvailabilityQuery_searchTeacherAvailability_teachers_gaps,
  "id" | "teacherId" | "teacherName" | "teacherGender" | "calendarDate" | "gapStartTime" | "gapEndTime"
> & {
  readonly dayOfWeek: string | null;
  readonly timezone: string | null;
};

export type SearchScheduleMonthDrawerTeacher = Omit<
  Pick<
    SearchTeacherAvailabilityQuery_searchTeacherAvailability_teachers,
    "id" | "name" | "gender" | "timezone" | "availableDaysCount" | "gaps"
  >,
  "gender" | "timezone" | "gaps"
> & {
  readonly gender: string | null;
  readonly timezone: string | null;
  readonly gaps: readonly (SearchScheduleGapItem | null)[] | null;
};

export interface SearchScheduleDraftFilters {
  readonly fromTime: string;
  readonly toTime: string;
  readonly fromDate: string;
  readonly toDate: string;
  readonly gender: Gender | null;
  readonly minAvailableDays: number | null;
  readonly minTotalGaps: number | null;
  readonly daysOfWeek: AvailabilitySearchInput["daysOfWeek"];
  readonly sortBy: AvailabilitySearchSortBy;
}

export interface PersistedSearchScheduleFilters {
  readonly gender: Gender | null;
  readonly minAvailableDays: number | null;
  readonly minTotalGaps: number | null;
  readonly daysOfWeek: AvailabilitySearchInput["daysOfWeek"];
  readonly sortBy: AvailabilitySearchSortBy;
}

export interface PersistedSearchScheduleState {
  readonly draftFilters: PersistedSearchScheduleFilters;
  readonly selectedTeacher: SearchScheduleTeacherOption | null;
  readonly pageSize: number;
  // Transient UI state (formFilterDrawerOpen, monthDrawerOpen) is intentionally NOT persisted —
  // it resets to false on rehydrate.
  readonly monthDrawerAnchorFromDate: string;
  readonly monthDrawerCurrentMonth: string;
  readonly monthDrawerTeacher: SearchScheduleMonthDrawerTeacher | null;
}

export interface SearchScheduleState {
  readonly draft: SearchScheduleDraftFilters;
  readonly activeInput: AvailabilitySearchInput | null;
  readonly hasSearched: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly selectedTeacher: SearchScheduleTeacherOption | null;
  readonly hasHydrated: boolean;
  // Form-filter drawer open state, lifted from the search-schedule form tiers.
  readonly formFilterDrawerOpen: boolean;
  // Sort menu anchor element, lifted from the search-schedule sort-menu tiers. Non-serializable
  // DOM element — excluded from persist via partialize.
  readonly sortMenuAnchorEl: HTMLElement | null;
  // Month drawer open flag, lifted from the availability grid and month-drawer tiers. The drawer
  // state is kept in the store so it survives viewport tier switches.
  readonly monthDrawerOpen: boolean;
  // Anchor ISO date (yyyy-MM-dd) the month drawer opened from.
  readonly monthDrawerAnchorFromDate: string;
  // ISO date (yyyy-MM-dd) representing the month drawer's currently navigated month.
  readonly monthDrawerCurrentMonth: string;
  // Teacher selected for the month drawer.
  readonly monthDrawerTeacher: SearchScheduleMonthDrawerTeacher | null;
  setDraft: (draft: Partial<SearchScheduleDraftFilters>) => void;
  setSelectedTeacher: (teacher: SearchScheduleTeacherOption | null) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  commitSearch: () => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
  buildActiveInput: () => AvailabilitySearchInput | null;
  /** Lazily initializes draft.fromDate and draft.toDate on first access. Idempotent. */
  readonly ensureDraftDates: () => void;
  setFormFilterDrawerOpen: (open: boolean) => void;
  setSortMenuAnchorEl: (anchor: HTMLElement | null) => void;
  openMonthDrawer: (teacher: SearchScheduleMonthDrawerTeacher, anchorFromDate: string) => void;
  closeMonthDrawer: () => void;
  setMonthDrawerCurrentMonth: (isoMonth: string) => void;
}
