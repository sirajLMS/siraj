import type { teacherImportantNotes } from "@/backend/db/schema";

export type TeacherImportantNoteSelectType = typeof teacherImportantNotes.$inferSelect;
export type TeacherImportantNoteInsertType = typeof teacherImportantNotes.$inferInsert;

export type TeacherImportantNoteReturnType = Omit<
  TeacherImportantNoteSelectType,
  "createdAt" | "updatedAt" | "deletedAt"
>;

export type TeacherImportantNoteSubmitInput = {
  title: string;
  body?: string | null;
  isPublished?: boolean;
  priority?: number;
  startsAt?: Date | null;
  expiresAt?: Date | null;
};

export type TeacherImportantNoteUpdateInput = {
  title?: string;
  body?: string | null;
  isPublished?: boolean;
  priority?: number;
  startsAt?: Date | null;
  expiresAt?: Date | null;
};

export type SupportContactReturnType = {
  id: string;
  name: string;
  role: string | null;
  avatarUrl: string | null;
  phone: string | null;
  skypeId: string | null;
};
