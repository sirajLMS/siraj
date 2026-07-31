import type {
  MeetingConfigSnapshot,
  UserMeetingConfigReturnType,
  UserMeetingConfigSelectType,
} from "@/backend/types/meeting/meeting-config.types";
import type { MeetingProviderSelectType } from "@/backend/types/meeting/meeting-provider.types";

export function buildMaskedMeetingConfig(
  config: UserMeetingConfigSelectType,
  isAdminScope: boolean,
  providerMap?: Map<string, MeetingProviderSelectType>
): UserMeetingConfigReturnType {
  return {
    ...config,
    hasSecret: Boolean(config.encryptedSecret),
    encryptedSecret: isAdminScope ? config.encryptedSecret : null,
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
  };
}
