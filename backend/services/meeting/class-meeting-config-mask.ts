import { maskProviderMetadata } from "@/backend/services/meeting/meeting-config-mask";
import type {
  ClassMeetingConfigReturnType,
  ClassMeetingConfigSelectType,
  MeetingProviderSelectType,
} from "@/backend/types";

export function buildMaskedClassMeetingConfig(
  config: ClassMeetingConfigSelectType,
  isAdminScope: boolean,
  providerMap?: Map<string, MeetingProviderSelectType>
): ClassMeetingConfigReturnType {
  return {
    ...config,
    hasSecret: Boolean(config.encryptedSecret),
    encryptedSecret: isAdminScope ? config.encryptedSecret : null,
    providerMetadata: maskProviderMetadata(config.providerMetadata, isAdminScope),
    provider: providerMap?.get(config.providerId),
  };
}

export function buildMaskedClassMeetingConfigs(
  configs: ClassMeetingConfigSelectType[],
  isAdminScope: boolean,
  providerMap?: Map<string, MeetingProviderSelectType>
): ClassMeetingConfigReturnType[] {
  return configs.map(c => buildMaskedClassMeetingConfig(c, isAdminScope, providerMap));
}
