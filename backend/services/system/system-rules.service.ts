import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { SystemSettingsRepository } from "@/backend/db/repo/shared/system-settings.repository";
import type { ClassInstanceSelectType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export namespace SystemRulesService {
  /**
   * Asserts that a class instance can be activated based on the system activation window.
   * Window: now >= scheduledStartAt - beforeMinutes AND now <= scheduledEndAt
   */
  export async function assertActivationTimeWindow(instance: ClassInstanceSelectType, locale?: string): Promise<void> {
    const beforeMinutes = await SystemSettingsRepository.getIntValue("session_activation_window_before_minutes", 5);
    const now = new Date();

    const startWindow = new Date(instance.scheduledStartAt);
    startWindow.setMinutes(startWindow.getMinutes() - beforeMinutes);

    const endWindow = new Date(instance.scheduledEndAt);

    if (now < startWindow || now > endWindow) {
      const t = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(t.scheduling.missedClassTime);
    }
  }

  export async function assertAbsentWaitingPeriod(instance: ClassInstanceSelectType, locale?: string): Promise<void> {
    const waitingMinutes = await SystemSettingsRepository.getIntValue("session_absent_waiting_minutes", 30);
    const now = new Date();

    const requiredWaitTime = new Date(instance.scheduledStartAt);
    requiredWaitTime.setMinutes(requiredWaitTime.getMinutes() + waitingMinutes);

    if (now < requiredWaitTime) {
      throw new Error(`absentTooEarly:${waitingMinutes}:${locale ?? "ar"}`);
    }
  }

  export async function assertLeaveQuotaAvailable(
    teacherId: string,
    locale?: string,
    tx?: Parameters<Parameters<typeof import("@/backend/db/drizzleDb").db.transaction>[0]>[0]
  ): Promise<void> {
    const now = new Date();
    const periodYear = now.getUTCFullYear();
    const periodMonth = now.getUTCMonth() + 1;

    const maxLeaves = await SystemSettingsRepository.getIntValue("teacher_max_leaves", 2, tx);
    const currentUsage = await SchedulingRepository.getTeacherLeaveQuotaUsage(teacherId, periodYear, periodMonth, tx);

    if (currentUsage >= maxLeaves) {
      const t = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(t.leaveQuotaExceeded({ maxLeaves: String(maxLeaves) }));
    }
  }
}
