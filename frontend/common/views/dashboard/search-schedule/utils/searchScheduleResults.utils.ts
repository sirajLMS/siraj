import type { TeacherAvailabilityGapItem } from "@/frontend/common/views/dashboard/search-schedule/types";
import type {
  SearchScheduleResultItem,
  SearchScheduleResultSummary,
} from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel";
import { buildDateColumns, groupGapsByDate } from "@/frontend/common/views/dashboard/search-schedule/utils";

interface SearchScheduleActiveTeacher {
  readonly teacher: SearchScheduleResultItem;
  readonly dateColumns: string[];
  readonly gapsByDate: ReadonlyMap<string, readonly TeacherAvailabilityGapItem[]>;
}

function getActiveTeachers(
  searchResult: SearchScheduleResultSummary | null | undefined
): readonly SearchScheduleResultItem[] {
  if (!searchResult) return [];
  const teachers = searchResult.teachers ?? [];
  return teachers.filter((teacher): teacher is SearchScheduleResultItem => teacher != null);
}

/**
 * Constructs teacher schedule slot structures from pre-filtered active teachers.
 */
function buildTeacherScheduleSlots(
  activeTeachers: readonly SearchScheduleResultItem[],
  fromDate: string,
  toDate: string
): readonly SearchScheduleActiveTeacher[] {
  const dateColumns = buildDateColumns(fromDate, toDate);
  return activeTeachers.map(teacher => ({
    teacher,
    dateColumns,
    gapsByDate: groupGapsByDate(teacher.gaps),
  }));
}

function getTotalGaps(searchResult: SearchScheduleResultSummary | null | undefined): number {
  return searchResult?.totalGaps ?? 0;
}

export interface SearchScheduleResultsData {
  readonly totalGaps: number;
  readonly activeTeachers: readonly SearchScheduleResultItem[];
  readonly teacherSlots: readonly SearchScheduleActiveTeacher[];
}

/**
 * Computes search schedule results data. Evaluates `getActiveTeachers` once
 * and reuses the active teachers array when building schedule slots.
 */
export function computeSearchScheduleResults(
  searchResult: SearchScheduleResultSummary | null | undefined,
  fromDate: string,
  toDate: string
): SearchScheduleResultsData {
  const activeTeachers = getActiveTeachers(searchResult);
  return {
    totalGaps: getTotalGaps(searchResult),
    activeTeachers,
    teacherSlots: buildTeacherScheduleSlots(activeTeachers, fromDate, toDate),
  };
}
