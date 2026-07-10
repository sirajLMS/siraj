import type {
  ClassMeetingConfigReturnType,
  ClassMeetingConfigSelectType,
} from "@/backend/types/meeting/class-meeting-config.types";

export function buildMaskedClassMeetingConfig(
  config: ClassMeetingConfigSelectType,
  isAdminScope: boolean
): ClassMeetingConfigReturnType {
  return {
    ...config,
    hasSecret: Boolean(config.encryptedSecret),
    encryptedSecret: isAdminScope ? config.encryptedSecret : null,
  };
}

export function buildMaskedClassMeetingConfigs(
  configs: ClassMeetingConfigSelectType[],
  isAdminScope: boolean
): ClassMeetingConfigReturnType[] {
  return configs.map(c => buildMaskedClassMeetingConfig(c, isAdminScope));
}
