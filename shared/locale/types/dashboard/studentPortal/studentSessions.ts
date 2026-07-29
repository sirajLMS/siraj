import type { StudentPortalHistoryStatusLabels } from "@/shared/locale/types/dashboard/studentPortal/studentHistory";

export interface StudentPortalSessionsLabels {
  readonly pageTitle: string;
  readonly sessionDate: string;
  readonly subject: string;
  readonly instructor: string;
  readonly duration: string;
  readonly status: string;
  readonly notes: string;
  readonly noHistory: string;
  readonly loadingMessage: string;
  readonly filterBySubject: string;
  readonly filterByStatus: string;
  readonly allSubjects: string;
  readonly allStatuses: string;
  readonly previousMonth: string;
  readonly nextMonth: string;
  readonly statusLabels: StudentPortalHistoryStatusLabels;
  readonly minutesShort: (minutes: number) => string;
  readonly viewClass: string;
  readonly joinSession: string;
}
