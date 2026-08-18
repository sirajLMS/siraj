import type { studentStatusHistory } from "@/backend/db/schema";

export type StudentStatusHistorySelectType = typeof studentStatusHistory.$inferSelect;
export type StudentStatusHistoryInsertType = typeof studentStatusHistory.$inferInsert;

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
