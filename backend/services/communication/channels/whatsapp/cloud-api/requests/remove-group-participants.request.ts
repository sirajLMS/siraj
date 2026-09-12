/**
 * Graph API request builder: DELETE /{group_id}/participants
 *
 * Removes up to 8 participants (Meta-enforced batch limit) from a WhatsApp
 * group. The sync response only confirms acceptance — per-participant
 * outcomes arrive asynchronously via the `group_participants_update`
 * webhook, so the parser never reports a removed list itself.
 */

import {
  buildAuthHeaders,
  buildGraphUrl,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import type { GraphApiRequestContext, GraphApiRequestInit, RemoveParticipantsOutcome } from "@/backend/types";

/** Meta-enforced maximum participants per remove-participants call. */
const MAX_PARTICIPANTS_PER_CALL = 8;

/**
 * Builds the fetch request for DELETE /{group_id}/participants.
 * The adapter adds `AbortSignal.timeout(10_000)` before executing the `fetch`.
 */
export function buildRemoveGroupParticipantsRequest(
  ctx: GraphApiRequestContext,
  input: { groupId: string; participants: string[] }
): GraphApiRequestInit {
  // Validate inputs before interpolation
  // These are internal developer-facing validation errors caught by the adapter and wrapped into structured error codes
  if (!input.groupId || input.groupId.length > 128) {
    throw new Error("Invalid groupId: must be non-empty and ≤128 chars");
  }
  if (!Array.isArray(input.participants) || input.participants.length === 0) {
    throw new Error("Invalid participants: must be a non-empty array");
  }
  if (input.participants.length > MAX_PARTICIPANTS_PER_CALL) {
    throw new Error(`Invalid participants: Meta allows at most ${MAX_PARTICIPANTS_PER_CALL} per call`);
  }
  if (input.participants.some(participant => !participant || participant.length === 0)) {
    throw new Error("Invalid participants: every entry must be a non-empty string");
  }

  const url = buildGraphUrl(`/${input.groupId}/participants`, ctx.apiVersion);

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    participants: input.participants.map(user => ({ user })),
  };

  return {
    url,
    init: {
      method: "DELETE",
      headers: buildAuthHeaders(ctx.accessToken, true),
      body: JSON.stringify(body),
    },
  };
}

/**
 * Parses a successful (2xx) sync response body from the remove-participants
 * endpoint. The sync response carries only `success` — per-participant
 * outcomes (removed vs failed, with error codes) arrive asynchronously via
 * the `group_participants_update` webhook, so callers MUST derive the actual
 * outcome from the webhook. This parser only confirms that Meta accepted the
 * removal request; the returned outcome is therefore always empty lists.
 *
 * @throws {Error} if the response shape is unexpected (`success` is not true).
 */
export function parseRemoveGroupParticipantsResponse(body: { success?: boolean }): RemoveParticipantsOutcome {
  if (body.success !== true) {
    // Internal adapter error — not user-facing, no i18n needed (unexpected Meta API response shape)
    throw new Error("Graph API remove-group-participants: missing success:true in response");
  }

  return {
    removed: [],
    failed: [],
  };
}
