"use client";

import { SearchScheduleFormShared } from "@/frontend/common/views/dashboard/search-schedule/components/searchScheduleFormShared";
import type { SearchScheduleFormProps } from "@/frontend/common/views/dashboard/search-schedule/types";
import { TeacherAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { SearchScheduleSortMenuMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/searchScheduleSortMenu.mobile";
import { SearchScheduleFilterDrawerMobile } from "@/frontend/mobile/views/dashboard/search-schedule/searchScheduleFilterDrawer.mobile";

const FORM_BOX_SX = { display: "flex", flexDirection: "column", gap: 1, px: 2, mb: 1 } as const;
const FULL_WIDTH_BOX_SX = { flex: "1 1 100%" } as const;
const ACTION_ROW_BOX_SX = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.5 } as const;
const INNER_ACTIONS_BOX_SX = { display: "flex", alignItems: "center", gap: 0.5 } as const;

export function SearchScheduleFormMobile(props: Readonly<SearchScheduleFormProps>) {
  return (
    <SearchScheduleFormShared
      {...props}
      TeacherAutocomplete={TeacherAutocompleteMobile}
      SortMenu={SearchScheduleSortMenuMobile}
      FilterDrawer={SearchScheduleFilterDrawerMobile}
      formBoxSx={FORM_BOX_SX}
      dateRangeBoxSx={FULL_WIDTH_BOX_SX}
      timeRangeBoxSx={FULL_WIDTH_BOX_SX}
      teacherBoxSx={FULL_WIDTH_BOX_SX}
      actionRowBoxSx={ACTION_ROW_BOX_SX}
      innerActionsBoxSx={INNER_ACTIONS_BOX_SX}
    />
  );
}
