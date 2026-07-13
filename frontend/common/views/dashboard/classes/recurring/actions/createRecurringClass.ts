"use server";

import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { parseIanaTimezone } from "@/backend/lib/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { RecurringClassService } from "@/backend/services/schedule/recurring-class.service";
import { toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { logger } from "@/frontend/common/utils/logger";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import { mapFormDataToServiceInput } from "@/frontend/common/views/dashboard/classes/recurring/utils/mapRecurringClassFormData";

export async function createRecurringClass(
  data: RecurringClassFormData,
  locale?: string
): Promise<
  | { success: true; classId: string; recurringScheduleId: string | null; classInstanceCount: number }
  | { success: false; message: string }
> {
  const { userId } = await getServerUserContext();
  if (!userId) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    return { success: false, message: t("unauthorized") };
  }

  try {
    const input = mapFormDataToServiceInput(data);

    if (input.days.length === 0) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      return { success: false, message: t("atLeastOneDayRequired") };
    }

    const result = await RecurringClassService.createRecurringClass(
      userId,
      { ...input, timezone: parseIanaTimezone(toGraphqlIanaTimezone(input.timezone)) },
      locale
    );

    return {
      success: true,
      classId: result.recurringScheduleId ?? "",
      recurringScheduleId: result.recurringScheduleId,
      classInstanceCount: result.classInstanceIds.length,
    };
  } catch (error) {
    logger.error("Failed to create recurring class", { error });
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    return { success: false, message: t("failedToCreateRecurringClass") };
  }
}
