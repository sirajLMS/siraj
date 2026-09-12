/**
 * Graph API request builder: GET /{group_id}?fields=...
 *
 * Fetches detailed metadata for a single WhatsApp group, including subject,
 * description, join-approval mode, suspension state, creation timestamp, and
 * the participant list. The `fields` param is explicit — Meta omits several
 * of these fields from the default field set, so without it the parser would
 * always see them as `undefined`.
 */

import { WhatsappGroupJoinApprovalMode } from "@/backend/enum/whatsapp/whatsapp-groups.enum";
import {
  buildAuthHeaders,
  buildGraphUrl,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import type { GraphApiRequestContext, GraphApiRequestInit, GroupInfo, GroupInfoRaw } from "@/backend/types";

/**
 * Builds the fetch request for GET /{group_id}.
 * The adapter adds `AbortSignal.timeout(10_000)` before executing.
 */
export function buildGetGroupInfoRequest(ctx: GraphApiRequestContext, input: { groupId: string }): GraphApiRequestInit {
  // Validate groupId: opaque Meta token (base64, may include `=` padding) — no
  // self-encoding here; `buildGraphUrl` encodeURIComponent's each non-empty
  // path segment, which is correct for group IDs with special characters (r6-sec-02)
  if (!input.groupId || input.groupId.length > 256) {
    throw new Error("Invalid groupId: must be non-empty and ≤256 chars");
  }

  // Request the fields the parser (`parseGetGroupInfoResponse`) consumes.
  const url = buildGraphUrl(
    `/${input.groupId}`,
    ctx.apiVersion,
    "?fields=id,subject,description,join_approval_mode,suspended,creation_timestamp,total_participant_count,participants"
  );

  return {
    url,
    init: {
      method: "GET",
      headers: buildAuthHeaders(ctx.accessToken),
    },
  };
}

/**
 * Maps a raw `GET /{group_id}` response into the canonical
 * {@link GroupInfo} shape — snake_case wire fields are converted to
 * camelCase and the participant list is reduced to `participantWaIds`.
 */
export function parseGetGroupInfoResponse(body: GroupInfoRaw): GroupInfo {
  const joinApprovalMode = mapJoinApprovalMode(body.join_approval_mode);
  return {
    groupId: body.id,
    subject: body.subject,
    description: body.description,
    joinApprovalMode,
    suspended: body.suspended,
    creationTimestamp: body.creation_timestamp,
    totalParticipantCount: body.total_participant_count,
    participantWaIds: body.participants?.map(participant => participant.wa_id) ?? [],
  };
}

/**
 * Maps the snake_case `join_approval_mode` wire value to the canonical
 * {@link WhatsappGroupJoinApprovalMode} enum. Returns `"approval_required"`
 * for unexpected shapes (defensive default for legacy group payloads).
 * @throws {Error} if the wire value is empty (unexpected Meta API response shape).
 */
function mapJoinApprovalMode(wireValue: string): WhatsappGroupJoinApprovalMode {
  if (!wireValue) {
    throw new Error("Graph API get-group-info: missing join_approval_mode in response");
  }
  // Compare against the Meta wire literal ("auto_approve") — the enum member
  // is `WhatsappGroupJoinApprovalMode.AutoApprove` (oxlint string-literal fix pattern).
  if (wireValue === "auto_approve") {
    return WhatsappGroupJoinApprovalMode.AutoApprove;
  }
  return WhatsappGroupJoinApprovalMode.ApprovalRequired;
}
