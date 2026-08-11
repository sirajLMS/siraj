import { mapStudentHistoryMetricsShared } from "@/frontend/common/views/dashboard/shared/history/studentHistoryMappersShared";
import type { StudentHistoryMetrics } from "@/frontend/common/views/dashboard/students/history/types";

export function mapStudentHistoryMetrics(
  metrics: Parameters<typeof mapStudentHistoryMetricsShared>[0]
): StudentHistoryMetrics {
  return mapStudentHistoryMetricsShared(metrics);
}
