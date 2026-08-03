import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { meetingProviderTokens } from "@/backend/db/schema";

export type MeetingProviderTokenSelectType = InferSelectModel<typeof meetingProviderTokens>;

export type MeetingProviderTokenInsertType = InferInsertModel<typeof meetingProviderTokens>;

/**
 * Represents the return type of meeting-provider token operations (mint, refresh, etc.).
 * Excludes internal database fields and surfaces the freshly-minted token pair.
 */
export type MeetingProviderTokenReturnType = Pick<
  MeetingProviderTokenSelectType,
  "id" | "userId" | "providerSlug" | "accessToken" | "refreshToken" | "expiresAt" | "scopes" | "createdAt" | "updatedAt"
>;

export type MeetingProviderTokenUpsertInput = {
  userId: string;
  providerSlug: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  scopes?: readonly string[];
};
