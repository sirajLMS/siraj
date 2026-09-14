import type { PothosInputFieldBuilder } from "@/backend/graphql/pothos/shared/builder-types";

/**
 * Shared input field for the Meta WhatsApp group id, reused across group
 * mutation inputs (settings update, send, pin, join-request and participants).
 */
export function whatsappGroupMetaIdInputField(t: PothosInputFieldBuilder) {
  return t.string({
    required: true,
    description: "Meta group id (max 256 chars)",
    directives: { constraint: { maxLength: 256 } },
  });
}
