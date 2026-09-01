import { z } from "zod";
import type { MeetingConfigManagerLabels } from "@/shared/locale/types/ui";

/** Label keys consumed by the form schema validation rules. */
export type MeetingConfigFormSchemaLabels = Pick<MeetingConfigManagerLabels, "nameRequired" | "providerRequired">;

/**
 * Factory creating a zod schema for the meeting config form dialog.
 *
 * Mirrors the `createSessionConfigFormSchema(labels)` / `createCredentialFormSchema(labels)`
 * pattern: pre-resolved label strings are injected so the schema has no
 * frozen `t` function dependency.
 *
 * Fields:
 * - `name` — the config label (required)
 * - `providerSlug` — selected provider's slug (required)
 * - `isDefault` — whether this config is the user's default
 * - `autoGenerate` — whether to auto-generate a meeting URL instead of entering one
 * - `settings` — additional provider-specific settings (meetingUrl, username, password, tenantId)
 */
export function createMeetingConfigFormSchema(labels: MeetingConfigFormSchemaLabels) {
  return z.object({
    name: z.string().trim().min(1, labels.nameRequired),
    providerSlug: z.string().trim().min(1, labels.providerRequired),
    isDefault: z.boolean(),
    autoGenerate: z.boolean(),
    settings: z.record(z.string(), z.unknown()),
  });
}
