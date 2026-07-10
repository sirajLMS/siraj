import type {
  MeetingConfigSnapshot,
  UserMeetingConfigReturnType,
  UserMeetingConfigSelectType,
} from "@/backend/types/meeting/meeting-config.types";
import type { MeetingProviderReturnType } from "@/backend/types/meeting/meeting-provider.types";

export function buildMaskedMeetingConfig(
  config: UserMeetingConfigSelectType,
  isAdminScope: boolean
): UserMeetingConfigReturnType {
  return {
    ...config,
    hasSecret: Boolean(config.encryptedSecret),
    encryptedSecret: isAdminScope ? config.encryptedSecret : null,
  };
}

export function buildMaskedMeetingConfigs(
  configs: UserMeetingConfigSelectType[],
  isAdminScope: boolean
): UserMeetingConfigReturnType[] {
  return configs.map(c => buildMaskedMeetingConfig(c, isAdminScope));
}

export function buildMeetingProviderCatalogSnapshot(
  provider: MeetingProviderReturnType
): MeetingConfigSnapshot["provider"] {
  return {
    catalogId: provider.id,
    catalogSlug: provider.slug,
    catalogName: provider.name,
    logoUrl: provider.logoUrl,
  };
}
