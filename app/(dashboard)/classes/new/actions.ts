"use server";

import type { CurrencyCode } from "@/backend/enum";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { parseIanaTimezone } from "@/backend/lib/enum";
import { RecurringClassService } from "@/backend/services/schedule/recurring-class.service";
import { toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { logger } from "@/frontend/common/utils/logger";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import { mapFormDataToServiceInput } from "@/frontend/common/views/dashboard/classes/recurring/utils/mapRecurringClassFormData";
import { getServerTranslations } from "@/shared/locale";

export async function createRecurringClass(
  data: RecurringClassFormData,
  locale?: string
): Promise<
  | { success: true; classId: string; recurringScheduleId: string | null; classInstanceCount: number }
  | { success: false; message: string }
> {
  const { userId } = await getServerUserContext();
  const localeSafe = locale ?? "en";
  const translations = getServerTranslations(localeSafe);

  if (!userId) {
    return { success: false, message: translations.errorsTranslations.unauthorized };
  }

  try {
    const input = mapFormDataToServiceInput(data);

    if (input.days.length === 0) {
      return {
        success: false,
        message: translations.dashboardTranslations.createRecurringClass.validation.daysRequired,
      };
    }

    const tErrors = translations.errorsTranslations;
    const result = await RecurringClassService.createRecurringClass(
      userId,
      {
        ...input,
        rateCurrency: (input.rateCurrency as CurrencyCode | null) ?? undefined,
        timezone: parseIanaTimezone(toGraphqlIanaTimezone(input.timezone)),
      },
      tErrors
    );

    return {
      success: true,
      classId: result.recurringScheduleId ?? "",
      recurringScheduleId: result.recurringScheduleId,
      classInstanceCount: result.classInstanceIds.length,
    };
  } catch (error) {
    logger.error("Failed to create recurring class", { error });
    return {
      success: false,
      message: translations.dashboardTranslations.createRecurringClass.validation.creationFailed,
    };
  }
}
