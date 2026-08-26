import type { meetingProviderTokens } from "@/backend/db/schema";

export type MeetingProviderTokenSelectType = typeof meetingProviderTokens.$inferSelect;

export type MeetingProviderTokenInsertType = typeof meetingProviderTokens.$inferInsert;

/**
 * Represents the return type of meeting-provider token operations (mint, refresh, etc.).
 * Excludes internal database fields and surfaces the freshly-minted token pair.
 */
/**
 * Secret view of meeting-provider tokens — includes plaintext accessToken/refreshToken.
 * Service-internal only: used by meeting adapter base + token-refresh logic.
 * MUST NOT be re-exported from the top-level @/backend/types barrel.
 * MUST NOT be imported by any .pothos.ts file.
 */
export type MeetingProviderTokenSecretView = Pick<
  MeetingProviderTokenSelectType,
  "id" | "userId" | "providerSlug" | "accessToken" | "refreshToken" | "expiresAt" | "scopes" | "createdAt" | "updatedAt"
>;

/**
 * Public return type for meeting-provider token operations.
 * Omits accessToken/refreshToken to prevent secret leakage via GraphQL.
 */
export type MeetingProviderTokenReturnType = Omit<MeetingProviderTokenSecretView, "accessToken" | "refreshToken">;

export type MeetingProviderTokenUpsertInput = {
  userId: string;
  providerSlug: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  scopes?: readonly string[];
};
