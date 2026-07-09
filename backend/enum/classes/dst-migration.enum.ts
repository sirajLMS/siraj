export enum DstMigrationResult {
  UPDATED = "UPDATED",
  CONFLICT = "CONFLICT",
  UNCHANGED = "UNCHANGED",
}

export enum MigrationStatus {
  IDLE = "idle",
  RUNNING = "running",
  COMPLETE = "complete",
}
