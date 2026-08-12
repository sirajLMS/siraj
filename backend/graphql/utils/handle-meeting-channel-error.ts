import { GraphQLError } from "graphql";
import { MeetingChannelError } from "@/backend/services";

/**
 * Maps a {@link MeetingChannelError} (which extends `Error`, not `GraphQLError`)
 * to a `GraphQLError` so that its `.code` reaches the frontend in
 * `extensions.code`. If the error is not a `MeetingChannelError`, it is
 * re-thrown unchanged.
 *
 * Mirrors the `handleSessionConfigServiceError` / `handleEnvConfigServiceError`
 * pattern used elsewhere in the GraphQL layer.
 */
export function handleMeetingChannelError(error: unknown): never {
  if (error instanceof MeetingChannelError) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: error.code,
        ...(error.upstreamMessage ? { upstreamMessage: error.upstreamMessage } : {}),
      },
    });
  }

  throw error;
}
