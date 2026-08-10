import { SystemSettingsRepository, UserRepository } from "@/backend/db/repo";
import { AppPermission, type FxProvider, FxProviderConfigSource } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  getResolvedFxProviderConfig,
  resetFxRateProvider,
} from "@/backend/services/fx/providers/FxRateProviderFactory";
import type { FxProviderConfigReturnType } from "@/backend/types";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";
import { getServerTranslations } from "@/shared/locale";

const FX_PROVIDER_SETTING_KEY = "fx_provider";

export namespace FxProviderConfigService {
  async function assertManagePermission(actorUserId: string, locale?: string): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_MANAGE_FX_PROVIDER);
    if (!hasPermission) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.insufficientPermissions);
    }
  }

  export async function getConfig(): Promise<FxProviderConfigReturnType> {
    const { provider, source } = await getResolvedFxProviderConfig();
    let updatedAt: Date | null = null;
    let updatedByUserId: string | null = null;
    let updatedByName: string | null = null;

    if (source === FxProviderConfigSource.DATABASE) {
      const setting = await SystemSettingsRepository.getByKey(FX_PROVIDER_SETTING_KEY);
      if (setting) {
        updatedAt = setting.updatedAt ?? null;
        updatedByUserId = setting.updatedByUserId ?? null;
        if (setting.updatedByUserId) {
          const user = await UserRepository.findSafeById(setting.updatedByUserId);
          updatedByName = user?.name ?? null;
        }
      }
    }

    return {
      id: "fx-provider-config",
      activeProvider: provider,
      source,
      updatedAt,
      updatedByUserId,
      updatedByName,
    };
  }

  export async function updateProvider(
    actorUserId: string,
    provider: FxProvider,
    locale?: string
  ): Promise<FxProviderConfigReturnType> {
    await assertManagePermission(actorUserId, locale);

    await SystemSettingsRepository.upsertSetting({
      key: FX_PROVIDER_SETTING_KEY,
      value: provider,
      dataType: SystemSettingDataType.String,
      description: "Active FX rate provider",
      category: SystemSettingCategory.Billing,
      updatedByUserId: actorUserId,
    });

    resetFxRateProvider();
    return getConfig();
  }
}
