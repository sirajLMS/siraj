import type { learningResources } from "@/backend/db/schema";

type LearningResourceSelectType = typeof learningResources.$inferSelect;

export type LearningResourceReturnType = Omit<LearningResourceSelectType, "deletedAt"> & {
  fileSize?: number | null;
  contentType?: string | null;
  uploadedByUserName?: string | null;
};

export type LearningResourceSubmitInput = {
  readonly displayName: string;
  readonly filePath: string;
  readonly fileId: string;
  readonly uploadedByUserId?: string | null;
};

export interface LearningResourceListResult {
  readonly rows: LearningResourceReturnType[];
  readonly totalCount: number;
}
