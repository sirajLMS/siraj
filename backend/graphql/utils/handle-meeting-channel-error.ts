import { GraphQLError } from "graphql";
import { MeetingChannelError } from "@/backend/services/meeting/channels/IMeetingChannel";

import type { ErrorsLabels } from "@/shared/locale/types/errors";

type StringKeys<T> = { [K in keyof T]: T[K] extends string ? K : never }[keyof T];

const MEETING_CHANNEL_ERROR_KEYS: Record<string, StringKeys<ErrorsLabels["meetingProvider"]>> = {
  RATE_LIMITED: "channelRateLimited",
  PERMISSION_DENIED: "channelPermissionDenied",
  PROVIDER_UNAVAILABLE: "channelProviderUnavailable",
  PROVIDER_REAUTH_REQUIRED: "channelProviderReauthRequired",
  UNSUPPORTED_PROVIDER_KIND: "channelUnsupportedProviderKind",
  INSUFFICIENT_SCOPES: "channelInsufficientScopes",
  INVALID_SERVICE_ACCOUNT_JSON: "channelInvalidServiceAccountJson",
  MISSING_IMPERSONATION_SUBJECT: "channelMissingImpersonationSubject",
  NO_ORG_CREDENTIALS_NO_USER_TOKEN: "channelNoOrgCredentialsNoUserToken",
  NO_APP_ACCESS_POLICY: "channelNoAppAccessPolicy",
};

/**
 * Maps a {@link MeetingChannelError} (which extends `Error`, not `GraphQLError`)
 * to a `GraphQLError` so that its `.code` reaches the frontend in
 * `extensions.code`. Uses a generic user-facing message instead of the internal
 * `error.message` (which may leak technical details, scope names, or upstream
 * provider responses). If the error is not a `MeetingChannelError`, it is
 * re-thrown unchanged.
 */
export function handleMeetingChannelError(error: unknown, tErrors: ErrorsLabels): never {
  if (error instanceof MeetingChannelError) {
    const key = MEETING_CHANNEL_ERROR_KEYS[error.code];
    const userMessage =
      key != null ? tErrors.meetingProvider[key] : tErrors.meetingProvider.channelProviderErrorOccurred;
    throw new GraphQLError(userMessage, {
      extensions: {
        code: error.code,
      },
    });
  }

  throw error;
}
