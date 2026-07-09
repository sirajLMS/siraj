import type { classSubjects, subjectResources } from "@/backend/db/schema";

export type ClassSubjectSelectType = typeof classSubjects.$inferSelect;
export type ClassSubjectInsertType = typeof classSubjects.$inferInsert;

export type ClassSubjectReturnType = Omit<ClassSubjectSelectType, "createdAt" | "updatedAt" | "deletedAt">;

export type ClassSubjectSubmitInput = {
  name: string;
  slug: string;
  categoryId: string;
  description?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type ClassSubjectUpdateInput = {
  name?: string;
  slug?: string;
  categoryId?: string;
  description?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type SubjectResourceSelectType = typeof subjectResources.$inferSelect;
export type SubjectResourceInsertType = typeof subjectResources.$inferInsert;

export type SubjectResourceReturnType = Omit<SubjectResourceSelectType, "createdAt" | "updatedAt" | "deletedAt"> & {
  displayName?: string | null;
  filePath?: string | null;
};

export type SubjectResourceAttachInput = {
  subjectId: string;
  learningResourceId: string;
  resourceType?: string | null;
  sortOrder?: number;
};
