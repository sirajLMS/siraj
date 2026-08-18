import { GraphQLError } from "graphql";
import { MeetingChannelError } from "@/backend/services";

const MEETING_CHANNEL_ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMITED: "Rate limited by meeting provider. Please try again later.",
  PERMISSION_DENIED: "Permission denied by meeting provider.",
  PROVIDER_UNAVAILABLE: "Meeting provider is currently unavailable.",
  PROVIDER_REAUTH_REQUIRED: "Re-authentication required for meeting provider.",
  UNSUPPORTED_PROVIDER_KIND: "This provider does not support automatic meeting URL generation.",
  INSUFFICIENT_SCOPES: "Insufficient permissions for meeting provider.",
  INVALID_SERVICE_ACCOUNT_JSON: "Invalid service account configuration.",
  MISSING_IMPERSONATION_SUBJECT: "Meeting provider impersonation subject is not configured.",
  NO_ORG_CREDENTIALS_NO_USER_TOKEN: "No meeting provider credentials configured.",
  NO_APP_ACCESS_POLICY: "No application access policy found for meeting provider.",
};

/**
 * Maps a {@link MeetingChannelError} (which extends `Error`, not `GraphQLError`)
 * to a `GraphQLError` so that its `.code` reaches the frontend in
 * `extensions.code`. Uses a generic user-facing message instead of the internal
 * `error.message` (which may leak technical details, scope names, or upstream
 * provider responses). If the error is not a `MeetingChannelError`, it is
 * re-thrown unchanged.
 */
export function handleMeetingChannelError(error: unknown): never {
  if (error instanceof MeetingChannelError) {
    const userMessage = MEETING_CHANNEL_ERROR_MESSAGES[error.code] ?? "Meeting provider error occurred.";
    throw new GraphQLError(userMessage, {
      extensions: {
        code: error.code,
      },
    });
  }

  throw error;
}
