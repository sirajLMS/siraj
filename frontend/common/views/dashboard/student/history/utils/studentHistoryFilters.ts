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
 * PERF OPTIMIZATION: Single-pass Set population replaces chained `.map()`, `.filter(Boolean)`,
 * spread `[...]`, and `.toSorted()`. This eliminates 3 intermediate array allocations and
 * redundant array passes per call during filter dropdown option computation.
 */
export function uniqueSessionSubjects(sessions: readonly StudentHistorySessionRow[]): readonly string[] {
  const subjects = new Set<string>();
  for (let i = 0; i < sessions.length; i++) {
    const title = sessions[i].title;
    if (title) {
      subjects.add(title);
    }
  }
  return Array.from(subjects).sort((a, b) => a.localeCompare(b));
}

/**
 * PERF OPTIMIZATION: Single-pass Set population replaces chained `.map()`, `.filter(Boolean)`,
 * spread `[...]`, and `.toSorted()`. This eliminates 3 intermediate array allocations and
 * redundant array passes per call during filter dropdown option computation.
 */
export function uniqueSessionStatuses(sessions: readonly StudentHistorySessionRow[]): readonly string[] {
  const statuses = new Set<string>();
  for (let i = 0; i < sessions.length; i++) {
    const status = sessions[i].status;
    if (status) {
      statuses.add(status);
    }
  }
  return Array.from(statuses).sort((a, b) => a.localeCompare(b));
}
