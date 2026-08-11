import type { EffectiveMeeting } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  mapStudentHistoryMetricsShared,
  mapStudentHistorySessionsShared,
} from "@/frontend/common/views/dashboard/shared/history/studentHistoryMappersShared";
import type {
  StudentHistoryMetrics,
  StudentHistorySessionRow,
} from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";

function isEffectiveMeeting(value: unknown): value is EffectiveMeeting {
  return typeof value === "object" && value !== null && "joinUrl" in value;
}

export function mapStudentHistoryMetrics(
  metrics: Parameters<typeof mapStudentHistoryMetricsShared>[0]
): StudentHistoryMetrics {
  return mapStudentHistoryMetricsShared(metrics);
}

export function mapStudentHistorySessions(
  sessions: Parameters<typeof mapStudentHistorySessionsShared>[0],
  year: number,
  month: number
): readonly StudentHistorySessionRow[] {
  return mapStudentHistorySessionsShared(sessions, year, month).map(row =>
    Object.assign({}, row, {
      effectiveMeeting: isEffectiveMeeting(row.effectiveMeeting) ? row.effectiveMeeting : null,
    })
  );
}
