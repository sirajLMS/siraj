import type { InputFieldBuilder } from "@pothos/core";
import type { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;
type PothosInputFieldBuilder = InputFieldBuilder<BuilderTypes, "InputObject">;

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
