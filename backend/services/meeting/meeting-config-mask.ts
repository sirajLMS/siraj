import type {
  MeetingConfigSnapshot,
  MeetingProviderSelectType,
  UserMeetingConfigReturnType,
  UserMeetingConfigSelectType,
} from "@/backend/types";

/** Sensitive keys within providerMetadata that must be masked for non-admin users. */
const SENSITIVE_METADATA_KEYS = new Set(["password", "token", "refreshToken", "accessToken"]);

/**
 * Masks sensitive fields (password, token, refreshToken, accessToken)
 * within a providerMetadata object for non-admin viewers.
 * Returns a shallow copy with sensitive top-level keys replaced by `"***"`.
 */
export function maskProviderMetadata(
  metadata: Record<string, unknown> | null | undefined,
  isAdminScope: boolean
): Record<string, unknown> | null {
  if (!metadata || isAdminScope) {
    return metadata ?? null;
  }

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    masked[key] = SENSITIVE_METADATA_KEYS.has(key) ? "***" : value;
  }
  return masked;
}

export function buildMaskedMeetingConfig(
  config: UserMeetingConfigSelectType,
  isAdminScope: boolean,
  providerMap?: Map<string, MeetingProviderSelectType>
): UserMeetingConfigReturnType {
  return {
    ...config,
    hasSecret: Boolean(config.encryptedSecret),
    encryptedSecret: isAdminScope ? config.encryptedSecret : null,
    providerMetadata: maskProviderMetadata(config.providerMetadata, isAdminScope),
    provider: providerMap?.get(config.providerId),
  };
}

export function buildMaskedMeetingConfigs(
  configs: UserMeetingConfigSelectType[],
  isAdminScope: boolean,
  providerMap?: Map<string, MeetingProviderSelectType>
): UserMeetingConfigReturnType[] {
  return configs.map(c => buildMaskedMeetingConfig(c, isAdminScope, providerMap));
}

export function buildMeetingProviderCatalogSnapshot(
  provider: MeetingProviderSelectType
): MeetingConfigSnapshot["provider"] {
  return {
    catalogId: provider.id,
    catalogSlug: provider.slug,
    catalogName: provider.name,
    logoUrl: provider.logoUrl,
    supportsAutoGeneration: Boolean(provider.fieldSchema?.supportsAutoGeneration),
  };
}
