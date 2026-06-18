import { SystemSettingsRepository } from "@/backend/db/repo/system-settings.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import type { ClassInstanceEntity } from "@/backend/types";

export namespace SystemRulesService {
  /**
   * Asserts that a class instance can be activated based on the system activation window.
   * Window: now >= scheduledStartAt - beforeMinutes AND now <= scheduledEndAt
   */
  export async function assertActivationTimeWindow(instance: ClassInstanceEntity, locale?: string): Promise<void> {
    const beforeMinutes = await SystemSettingsRepository.getIntValue("session_activation_window_before_minutes", 5);
    const now = new Date();

    const startWindow = new Date(instance.scheduledStartAt);
    startWindow.setMinutes(startWindow.getMinutes() - beforeMinutes);

    const endWindow = new Date(instance.scheduledEndAt);

    if (now < startWindow || now > endWindow) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("missedClassTime"));
    }
  }
}
