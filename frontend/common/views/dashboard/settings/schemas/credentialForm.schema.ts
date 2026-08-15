import { z } from "zod";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

export type CredentialFormLabels = Pick<
  SettingsMeetingIntegrationsLabels,
  "clientIdRequired" | "clientSecretRequired" | "scopesRequired"
>;

export type CredentialFormFieldLabels = Pick<
  SettingsMeetingIntegrationsLabels["credentialForm"],
  "clientId" | "clientSecret" | "tenantId" | "scopes" | "webhookSecret" | "accountId"
>;

export function createCredentialFormSchema(labels: CredentialFormLabels) {
  return z.object({
    clientId: z.string().trim().min(1, labels.clientIdRequired),
    clientSecret: z.string().trim().min(1, labels.clientSecretRequired),
    tenantId: z.string().trim().optional().or(z.literal("")),
    scopes: z.array(z.string().trim().min(1)).min(1, labels.scopesRequired),
    webhookSecret: z.string().trim().optional().or(z.literal("")),
    accountId: z.string().trim().optional().or(z.literal("")),
  });
}

export type CredentialFormValues = z.infer<ReturnType<typeof createCredentialFormSchema>>;
export type CredentialFormInput = z.input<ReturnType<typeof createCredentialFormSchema>>;
