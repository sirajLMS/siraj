"use client";

import { SearchScheduleFormShared } from "@/frontend/common/views/dashboard/search-schedule/components/searchScheduleFormShared";
import type { SearchScheduleFormProps } from "@/frontend/common/views/dashboard/search-schedule/types";
import { TeacherAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";
import { SearchScheduleSortMenuDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/searchScheduleSortMenu.desktop";
import { SearchScheduleFilterDrawerDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/searchScheduleFilterDrawer.desktop";

const FORM_BOX_SX = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 2 } as const;
const DATE_RANGE_BOX_SX = { flex: { xs: "1 1 100%", sm: "1 1 200px" }, minWidth: { sm: 200 } } as const;
const TIME_RANGE_BOX_SX = { flex: { xs: "1 1 100%", sm: "0 1 160px" }, minWidth: { sm: 140 } } as const;
const TEACHER_BOX_SX = { flex: "1 1 200px", minWidth: { xs: "100%", sm: 180 } } as const;
const ACTION_ROW_BOX_SX = { display: "flex", alignItems: "center", gap: 0.5, flex: "0 0 auto" } as const;

export function SearchScheduleFormDesktop(props: Readonly<SearchScheduleFormProps>) {
  return (
    <SearchScheduleFormShared
      {...props}
      TeacherAutocomplete={TeacherAutocompleteDesktop}
      SortMenu={SearchScheduleSortMenuDesktop}
      FilterDrawer={SearchScheduleFilterDrawerDesktop}
      formBoxSx={FORM_BOX_SX}
      dateRangeBoxSx={DATE_RANGE_BOX_SX}
      timeRangeBoxSx={TIME_RANGE_BOX_SX}
      teacherBoxSx={TEACHER_BOX_SX}
      actionRowBoxSx={ACTION_ROW_BOX_SX}
    />
  );
}
