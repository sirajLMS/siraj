/**
 * Graph API request builders: POST /{group_id} (group settings)
 *
 * Updates WhatsApp group metadata — subject, description, and profile
 * picture. The JSON variant carries text fields only; the multipart
 * variant additionally uploads a profile photo. Meta reports per-field
 * update failures asynchronously via the `group_settings_update` webhook,
 * not through the synchronous response envelope.
 */

import {
  buildAuthHeaders,
  buildGraphUrl,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import type { GraphApiRequestContext, GraphApiRequestInit } from "@/backend/types";

const MAX_GROUP_ID_LENGTH = 256;
const MAX_SUBJECT_LENGTH = 128;
const MAX_DESCRIPTION_LENGTH = 2048;

/**
 * Builds the fetch request for POST /{group_id} (JSON variant).
 * Sends at least one of `subject` / `description` — Meta rejects empty
 * settings payloads. The adapter adds `AbortSignal.timeout(10_000)` before
 * executing the `fetch`.
 */
export function buildUpdateGroupSettingsRequest(
  ctx: GraphApiRequestContext,
  input: { groupId: string; subject?: string; description?: string }
): GraphApiRequestInit {
  // Validate inputs before interpolation
  // These are internal developer-facing validation errors caught by the adapter and wrapped into structured error codes
  if (!input.groupId || input.groupId.length > MAX_GROUP_ID_LENGTH) {
    throw new Error("Invalid groupId: must be non-empty and ≤256 chars");
  }
  if (input.subject !== undefined && (!input.subject.trim() || input.subject.length > MAX_SUBJECT_LENGTH)) {
    throw new Error("Invalid subject: must be non-empty (whitespace-only rejected) and ≤128 chars");
  }
  if (input.description !== undefined && input.description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error("Invalid description: must be ≤2048 chars");
  }
  if (input.subject === undefined && input.description === undefined) {
    throw new Error("Invalid settings payload: at least one of subject or description is required");
  }

  const url = buildGraphUrl(`/${input.groupId}`, ctx.apiVersion);

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    ...(input.subject !== undefined ? { subject: input.subject } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
  };

  return {
    url,
    init: {
      method: "POST",
      headers: buildAuthHeaders(ctx.accessToken, true),
      body: JSON.stringify(body),
    },
  };
}

/**
 * Input for the multipart group settings request (profile photo upload).
 *
 * `mimeType` is taken from the caller-supplied file when available; Meta
 * only accepts `image/jpeg` for group profile pictures. When only a raw
 * `Buffer` is supplied the caller must guarantee the payload is JPEG —
 * the builder cannot sniff bytes, so no runtime rejection is applied for
 * that variant.
 */
export interface UpdateGroupSettingsMultipartInput {
  readonly groupId: string;
  readonly file: Blob | Buffer;
  readonly fileName: string;
  /** MIME type of `file` when the caller carries it (e.g. from an upload part). */
  readonly mimeType?: string;
  readonly subject?: string;
  readonly description?: string;
}

/**
 * Builds the fetch request for POST /{group_id} (multipart variant) with an
 * attached profile photo. The body is a `FormData` — the adapter's `fetch`
 * sets the multipart boundary `Content-Type`, so only the Authorization
 * header is provided. The adapter adds `AbortSignal.timeout(10_000)` before
 * executing the `fetch`.
 */
export function buildUpdateGroupSettingsMultipartRequest(
  ctx: GraphApiRequestContext,
  input: UpdateGroupSettingsMultipartInput
): GraphApiRequestInit {
  // Validate inputs before interpolation
  // These are internal developer-facing validation errors caught by the adapter and wrapped into structured error codes
  if (!input.groupId || input.groupId.length > MAX_GROUP_ID_LENGTH) {
    throw new Error("Invalid groupId: must be non-empty and ≤256 chars");
  }
  if (!input.file) {
    throw new Error("Invalid file: a profile photo file is required");
  }
  if (!input.fileName?.trim()) {
    throw new Error("Invalid fileName: must be non-empty");
  }
  if (input.mimeType !== undefined && input.mimeType !== "image/jpeg") {
    throw new Error("Invalid mimeType: group profile photo must be image/jpeg");
  }
  if (input.subject !== undefined && (!input.subject.trim() || input.subject.length > MAX_SUBJECT_LENGTH)) {
    throw new Error("Invalid subject: must be non-empty (whitespace-only rejected) and ≤128 chars");
  }
  if (input.description !== undefined && input.description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error("Invalid description: must be ≤2048 chars");
  }

  const url = buildGraphUrl(`/${input.groupId}`, ctx.apiVersion);

  const formData = new FormData();
  formData.append("messaging_product", "whatsapp");
  formData.append(
    "file",
    input.file instanceof Blob ? input.file : new Blob([new Uint8Array(input.file)]),
    input.fileName
  );
  if (input.subject !== undefined) {
    formData.append("subject", input.subject);
  }
  if (input.description !== undefined) {
    formData.append("description", input.description);
  }

  return {
    url,
    init: {
      method: "POST",
      headers: buildAuthHeaders(ctx.accessToken),
      body: formData,
    },
  };
}

/**
 * Parses a successful (2xx) response body from the group settings update.
 * Meta returns a `success` envelope; per-field failures arrive later via
 * the `group_settings_update` webhook.
 */
export function parseUpdateGroupSettingsResponse(body: { success?: boolean }): boolean {
  return body.success === true;
}
