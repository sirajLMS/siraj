import type { studentProgress } from "@/backend/db/schema";

export type StudentProgressSelectType = typeof studentProgress.$inferSelect;
export type StudentProgressInsertType = typeof studentProgress.$inferInsert;

export type StudentProgressUpsertInput = Pick<
  StudentProgressInsertType,
  | "studentId"
  | "classInstanceId"
  | "teacherId"
  | "topicsCovered"
  | "homeworkAssigned"
  | "notes"
  | "parentVisible"
  | "createdAt"
  | "updatedAt"
>;
