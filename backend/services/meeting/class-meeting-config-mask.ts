import type {
  ClassMeetingConfigReturnType,
  ClassMeetingConfigSelectType,
} from "@/backend/types/meeting/class-meeting-config.types";
import type { MeetingProviderSelectType } from "@/backend/types/meeting/meeting-provider.types";

export function buildMaskedClassMeetingConfig(
  config: ClassMeetingConfigSelectType,
  isAdminScope: boolean,
  providerMap?: Map<string, MeetingProviderSelectType>
): ClassMeetingConfigReturnType {
  return {
    ...config,
    hasSecret: Boolean(config.encryptedSecret),
    encryptedSecret: isAdminScope ? config.encryptedSecret : null,
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
