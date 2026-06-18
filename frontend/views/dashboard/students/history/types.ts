export interface ClassSession {
  readonly id: string;
  readonly dayOfMonth: number;
  readonly title: string;
  readonly time: string;
  readonly duration: number;
  readonly status: string;
  readonly instructor: string;
  readonly timeSlot: string;
  readonly room: string;
  readonly notes: string;
}

export interface StudentHistoryMetrics {
  readonly totalClasses: number;
  readonly attendanceRate: number;
  readonly hoursStudied: number;
  readonly performance: number;
}
