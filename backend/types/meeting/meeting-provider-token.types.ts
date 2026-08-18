import type { meetingProviderTokens } from "@/backend/db/schema";

export type MeetingProviderTokenSelectType = typeof meetingProviderTokens.$inferSelect;

export type MeetingProviderTokenInsertType = typeof meetingProviderTokens.$inferInsert;

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
