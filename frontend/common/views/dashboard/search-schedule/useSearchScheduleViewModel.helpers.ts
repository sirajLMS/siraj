import type { SearchScheduleMonthDrawerTeacher } from "@/frontend/common/stores/searchScheduleStore";
import type { SearchScheduleResultItem } from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel.types";

export function adaptResultItemToStoreTeacher(teacher: SearchScheduleResultItem): SearchScheduleMonthDrawerTeacher {
  return {
    id: teacher.id ?? null,
    name: teacher.name ?? null,
    gender: teacher.gender ?? null,
    timezone: teacher.timezone ?? null,
    availableDaysCount: teacher.availableDaysCount ?? null,
    gaps: teacher.gaps ?? null,
  };
}
