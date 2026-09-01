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

export function uniqueSessionSubjects(sessions: readonly StudentHistorySessionRow[]): readonly string[] {
  return [...new Set(sessions.map(s => s.title).filter(Boolean))].toSorted((a, b) => a.localeCompare(b));
}

export function uniqueSessionStatuses(sessions: readonly StudentHistorySessionRow[]): readonly string[] {
  return [...new Set(sessions.map(s => s.status).filter(Boolean))].toSorted((a, b) => a.localeCompare(b));
}
