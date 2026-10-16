import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";

export function mapSessionsByDay(
  sessions: readonly StudentHistorySessionRow[]
): Readonly<Partial<Record<number, StudentHistorySessionRow>>> {
  const map: Partial<Record<number, StudentHistorySessionRow>> = {};
  for (const session of sessions) {
    if (session.dayOfMonth > 0 && !map[session.dayOfMonth]) {
      map[session.dayOfMonth] = session;
    }
  }
  return map;
}

export function collectDaysWithSessions(sessions: readonly StudentHistorySessionRow[]): ReadonlySet<number> {
  const days = new Set<number>();
  for (const session of sessions) {
    if (session.dayOfMonth > 0) {
      days.add(session.dayOfMonth);
    }
  }
  return days;
}

export function filterHistorySessions(
  sessions: readonly StudentHistorySessionRow[],
  subjectFilter: string,
  statusFilter: string
): readonly StudentHistorySessionRow[] {
  return sessions.filter(session => {
    const subjectOk = !subjectFilter || session.title === subjectFilter;
    const statusOk = !statusFilter || session.status === statusFilter;
    return subjectOk && statusOk;
  });
}

/**
 * Returns sorted unique non-empty subject titles for session filter dropdowns.
 *
 * Performance optimization: Single-pass loop populates a `Set` directly to eliminate
 * intermediate array allocations from `.map()`, `.filter()`, and array spread before sorting.
 */
export function uniqueSessionSubjects(sessions: readonly StudentHistorySessionRow[]): readonly string[] {
  const set = new Set<string>();
  for (let i = 0; i < sessions.length; i++) {
    const title = sessions[i].title;
    if (title) {
      set.add(title);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Returns sorted unique non-empty session statuses for filter dropdowns.
 *
 * Performance optimization: Single-pass loop populates a `Set` directly to eliminate
 * intermediate array allocations from `.map()`, `.filter()`, and array spread before sorting.
 */
export function uniqueSessionStatuses(sessions: readonly StudentHistorySessionRow[]): readonly string[] {
  const set = new Set<string>();
  for (let i = 0; i < sessions.length; i++) {
    const status = sessions[i].status;
    if (status) {
      set.add(status);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
