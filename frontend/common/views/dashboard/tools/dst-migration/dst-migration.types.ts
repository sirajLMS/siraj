export interface UpdatedSession {
  readonly id: string;
  readonly studentId: string;
  readonly teacherId: string;
  readonly studentName: string;
  readonly teacherName: string;
  readonly fromTime: string;
  readonly toTime: string;
}

export interface ConflictItem {
  readonly id: string;
  readonly studentName: string;
  readonly message: string;
}

export interface ConflictGroup {
  readonly id: string;
  readonly teacherName: string;
  readonly conflicts: readonly ConflictItem[];
}

export interface CheckedEmptyItem {
  readonly id: string;
  readonly studentName: string;
  readonly reason: string;
}

export interface DstMigrationMetrics {
  readonly totalAudited: number;
  readonly successful: number;
  readonly conflicts: number;
  readonly unchanged: number;
}

export enum MigrationStatus {
  IDLE = "idle",
  RUNNING = "running",
  COMPLETE = "complete",
}
