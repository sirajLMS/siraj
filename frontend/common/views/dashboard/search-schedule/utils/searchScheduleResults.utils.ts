import type { TeacherAvailabilityGapItem } from "@/frontend/common/views/dashboard/search-schedule/types";
import type {
  SearchScheduleResultItem,
  SearchScheduleResultSummary,
} from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel";
import { buildDateColumns, groupGapsByDate } from "@/frontend/common/views/dashboard/search-schedule/utils";

export interface SearchScheduleActiveTeacher {
  readonly teacher: SearchScheduleResultItem;
  readonly dateColumns: string[];
  readonly gapsByDate: ReadonlyMap<string, readonly TeacherAvailabilityGapItem[]>;
}

export function getActiveTeachers(
  searchResult: SearchScheduleResultSummary | null | undefined
): readonly SearchScheduleResultItem[] {
  if (!searchResult) return [];
  const teachers = searchResult.teachers ?? [];
  return teachers.filter((teacher): teacher is SearchScheduleResultItem => teacher != null);
}

export function buildTeacherScheduleSlots(
  searchResult: SearchScheduleResultSummary | null | undefined,
  fromDate: string,
  toDate: string
): readonly SearchScheduleActiveTeacher[] {
  const activeTeachers = getActiveTeachers(searchResult);
  const dateColumns = buildDateColumns(fromDate, toDate);
  return activeTeachers.map(teacher => ({
    teacher,
    dateColumns,
    gapsByDate: groupGapsByDate(teacher.gaps),
  }));
}

export function getTotalGaps(searchResult: SearchScheduleResultSummary | null | undefined): number {
  return searchResult?.totalGaps ?? 0;
}
