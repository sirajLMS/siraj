import { z } from "zod";
import type { SettingsSessionTabLabels } from "@/shared/locale/types/dashboard/settings/session";

export const SESSION_TTL_SECONDS_MIN = 60;
export const SESSION_TTL_SECONDS_MAX = 2_419_200;
export const SESSION_CONCURRENT_MIN = 1;
export const SESSION_CONCURRENT_MAX = 50;

export function createSessionConfigFormSchema(
  labels: Pick<
    SettingsSessionTabLabels,
    "roleNameRequired" | "ttlRequired" | "ttlOutOfRange" | "concurrentRequired" | "concurrentOutOfRange"
  >
) {
  return z.object({
    roleName: z.string().trim().min(1, labels.roleNameRequired),
    ttlSeconds: z.coerce
      .number({ message: labels.ttlRequired })
      .int(labels.ttlRequired)
      .min(SESSION_TTL_SECONDS_MIN, labels.ttlOutOfRange)
      .max(SESSION_TTL_SECONDS_MAX, labels.ttlOutOfRange),
    maxConcurrentSessions: z.coerce
      .number({ message: labels.concurrentRequired })
      .int(labels.concurrentRequired)
      .min(SESSION_CONCURRENT_MIN, labels.concurrentOutOfRange)
      .max(SESSION_CONCURRENT_MAX, labels.concurrentOutOfRange),
  });
}

export type SessionConfigFormValues = z.infer<ReturnType<typeof createSessionConfigFormSchema>>;
export type SessionConfigFormInput = z.input<ReturnType<typeof createSessionConfigFormSchema>>;
