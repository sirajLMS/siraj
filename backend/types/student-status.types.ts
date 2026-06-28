export interface StudentUpcomingClass {
  readonly id: string;
  readonly instructor: string;
  readonly scheduledStartAt: Date;
  readonly scheduledEndAt: Date;
  readonly durationMinutes: number;
  readonly executionState: string;
  readonly isFrozen: boolean;
}

export interface StudentUpcomingClassesResult {
  readonly id: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly status: string;
  readonly classes: StudentUpcomingClass[];
}
