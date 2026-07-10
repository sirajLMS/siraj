import { SystemSettingsRepository } from "@/backend/db/repo";
import { AppPermission, type FxProvider } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  getResolvedFxProviderConfig,
  resetFxRateProvider,
} from "@/backend/services/fx/providers/FxRateProviderFactory";
import type { FxProviderConfigReturnType } from "@/backend/types";

const FX_PROVIDER_SETTING_KEY = "fx_provider";

export namespace FxProviderConfigService {
  async function assertManagePermission(actorUserId: string, locale?: string): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.BILLING_MANAGE_FX_PROVIDER);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }
  }

  export async function getConfig(): Promise<FxProviderConfigReturnType> {
    const { provider, source } = await getResolvedFxProviderConfig();
    return {
      id: "fx-provider-config",
      activeProvider: provider,
      source,
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
      dataType: "string",
      description: "Active FX rate provider",
      category: "billing",
      updatedByUserId: actorUserId,
    });

    resetFxRateProvider();
    return getConfig();
  }
}
