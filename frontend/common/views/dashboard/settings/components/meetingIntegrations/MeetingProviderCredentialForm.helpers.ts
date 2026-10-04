import type { UseFormSetValue } from "react-hook-form";
import type {
  EnvConfigEntryFieldsFragment,
  MeetingIntegrationProviderSlug,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { CredentialFormValues } from "@/frontend/common/views/dashboard/settings/schemas/credentialForm.schema";

export const FORM_ID_PREFIX = "meeting-credential-form-";
const SHARED_MEETING_KEYS = new Set(["OAUTH_REDIRECT_BASE_URL"]);

function isProviderKey(key: string, providerSlugUpper: string): boolean {
  if (SHARED_MEETING_KEYS.has(key)) {
    return true;
  }
  return key.startsWith(`${providerSlugUpper}_`);
}

function extractEnvValue(entries: readonly EnvConfigEntryFieldsFragment[], key: string): string {
  const entry = entries.find(e => e.key === key);
  return entry?.value ?? "";
}

export function hasEnvOverride(entries: readonly EnvConfigEntryFieldsFragment[], key: string): boolean {
  const entry = entries.find(e => e.key === key);
  return entry?.hasDbOverride === true;
}

export function filterProviderEntries(
  allEntries: readonly (EnvConfigEntryFieldsFragment | null | undefined)[],
  providerSlugUpper: MeetingIntegrationProviderSlug
): EnvConfigEntryFieldsFragment[] {
  const filtered = allEntries.filter((entry): entry is EnvConfigEntryFieldsFragment => entry != null);
  return filtered.filter(
    entry => entry.category === "meeting" && entry.key != null && isProviderKey(entry.key, providerSlugUpper)
  );
}

export function parseScopesFromEntries(
  entries: readonly EnvConfigEntryFieldsFragment[],
  providerSlugUpper: MeetingIntegrationProviderSlug
): string[] {
  const scopesValue = extractEnvValue(entries, `${providerSlugUpper}_SCOPES`);
  return scopesValue
    ? scopesValue
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
    : [];
}

export function buildDefaultValues(
  providerEntries: readonly EnvConfigEntryFieldsFragment[],
  providerSlugUpper: MeetingIntegrationProviderSlug,
  initialScopes: readonly string[]
): CredentialFormValues {
  return {
    clientId: extractEnvValue(providerEntries, `${providerSlugUpper}_CLIENT_ID`),
    clientSecret: "",
    tenantId: extractEnvValue(providerEntries, `${providerSlugUpper}_TENANT_ID`),
    scopes: [...initialScopes],
    webhookSecret: "",
    accountId: extractEnvValue(providerEntries, `${providerSlugUpper}_ACCOUNT_ID`),
  };
}

export function buildCredentialEntries(
  providerSlugUpper: MeetingIntegrationProviderSlug,
  values: CredentialFormValues
): ReadonlyArray<{ key: string; value: string }> {
  return [
    { key: `${providerSlugUpper}_CLIENT_ID`, value: values.clientId },
    { key: `${providerSlugUpper}_CLIENT_SECRET`, value: values.clientSecret },
    ...(values.tenantId ? [{ key: `${providerSlugUpper}_TENANT_ID`, value: values.tenantId }] : []),
    { key: `${providerSlugUpper}_SCOPES`, value: values.scopes.join(",") },
    ...(values.webhookSecret ? [{ key: `${providerSlugUpper}_WEBHOOK_SECRET`, value: values.webhookSecret }] : []),
    ...(values.accountId ? [{ key: `${providerSlugUpper}_ACCOUNT_ID`, value: values.accountId }] : []),
  ];
}

export function buildFieldMap(
  providerSlugUpper: MeetingIntegrationProviderSlug
): Record<string, keyof CredentialFormValues> {
  return {
    [`${providerSlugUpper}_CLIENT_ID`]: "clientId",
    [`${providerSlugUpper}_CLIENT_SECRET`]: "clientSecret",
    [`${providerSlugUpper}_TENANT_ID`]: "tenantId",
    [`${providerSlugUpper}_SCOPES`]: "scopes",
    [`${providerSlugUpper}_WEBHOOK_SECRET`]: "webhookSecret",
    [`${providerSlugUpper}_ACCOUNT_ID`]: "accountId",
  };
}

export function applyResetDraftValues(
  setValue: UseFormSetValue<CredentialFormValues>,
  providerEntries: readonly EnvConfigEntryFieldsFragment[],
  providerSlugUpper: MeetingIntegrationProviderSlug,
  initialScopes: readonly string[]
): void {
  setValue("clientId", extractEnvValue(providerEntries, `${providerSlugUpper}_CLIENT_ID`));
  setValue("clientSecret", "");
  setValue("tenantId", extractEnvValue(providerEntries, `${providerSlugUpper}_TENANT_ID`));
  setValue("scopes", [...initialScopes]);
  setValue("webhookSecret", "");
  setValue("accountId", extractEnvValue(providerEntries, `${providerSlugUpper}_ACCOUNT_ID`));
}
