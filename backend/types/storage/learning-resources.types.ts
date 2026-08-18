import type { learningResources } from "@/backend/db/schema/communications/communications";

export type LearningResourceSelectType = typeof learningResources.$inferSelect;
export type LearningResourceInsertType = typeof learningResources.$inferInsert;

export type LearningResourceReturnType = Omit<LearningResourceSelectType, "deletedAt"> & {
  fileSize?: number | null;
  contentType?: string | null;
  uploadedByUserName?: string | null;
};

export type LearningResourceSubmitInput = {
  displayName: string;
  filePath: string;
  fileId: string;
};

export interface LearningResourceCreateInput {
  readonly displayName: string;
  readonly filePath: string;
  readonly uploadedByUserId: string;
  readonly fileId: string;
}

export interface LearningResourceListResult {
  readonly rows: LearningResourceReturnType[];
  readonly totalCount: number;
}
