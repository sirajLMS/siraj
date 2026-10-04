import type { UpcomingLessonRow } from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";
import {
  isToday,
  isWithinNextDays,
} from "@/frontend/common/views/dashboard/student/dashboard/utils/studentDashboardMappers";

export function findNextLesson(upcomingLessons: readonly UpcomingLessonRow[]): UpcomingLessonRow | null {
  const joinable = upcomingLessons.find(
    l => isWithinNextDays(l.scheduledStartAt, 7) && Boolean(l.meetingJoinUrl) && !l.isFrozen
  );
  return joinable ?? upcomingLessons[0] ?? null;
}

export function countLessonsToday(upcomingLessons: readonly UpcomingLessonRow[]): number {
  return upcomingLessons.filter(l => isToday(l.scheduledStartAt)).length;
}
