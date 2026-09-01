import type { studentStatusHistory } from "@/backend/db/schema";
import type { StudentStatus } from "@/backend/enum";

export type StudentStatusHistorySelectType = typeof studentStatusHistory.$inferSelect;

export type CreateInitialStatusHistoryInput = {
  studentId: string;
  newStatus: StudentStatus;
  changedByUserId: string | null;
  createdAt: Date;
};

/**
 * Input for logging a status transition (UPDATE path).
 * Used by the app-layer SQLite fallback for `trg_log_student_status_history`
 * (PG-only trigger; SQLite has no session vars / plpgsql).
 */
export type LogStatusTransitionInput = {
  studentId: string;
  oldStatus: StudentStatus;
  newStatus: StudentStatus;
  changedByUserId: string | null;
  createdAt: Date;
};

export type SessionSummary = {
  id: string;
  title: string;
  time: string;
  duration: number;
  status: string;
  outcome?: string | null;
  isFrozen: boolean;
  instructor: string;
  teacherId: string;
  timeSlot: string;
  room: string | null;
  notes: string;
  dayOfMonth: number;
};
