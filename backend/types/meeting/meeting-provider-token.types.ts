import type { meetingProviderTokens } from "@/backend/db/schema";

export type MeetingProviderTokenSelectType = typeof meetingProviderTokens.$inferSelect;

export type MeetingProviderTokenUpsertInput = {
  userId: string;
  providerSlug: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  scopes?: readonly string[];
};
