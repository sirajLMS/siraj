import { getServerTranslations } from "@/shared/locale";
import type { UrgentComplaintResponseSmsData } from "@/backend/types";

function sanitizeSms(text: string): string {
  return text.replace(/[\r\n\t]/g, " ").trim();
}


export const renderUrgentComplaintResponseSms = async (
  data: UrgentComplaintResponseSmsData,
  locale?: string
): Promise<string> => {
  const t = getServerTranslations(locale ?? "en").smsTranslations.complaintResponse;

  return t.urgentResponse({
    parentName: sanitizeSms(data.parentName),
    complaintTitle: sanitizeSms(data.complaintTitle),
    responseSummary: sanitizeSms(data.responseSummary),
  });
};

export const renderSuggestionAcknowledgedSms = async (
  data: { readonly parentName: string; readonly suggestionTitle: string },
  locale?: string
): Promise<string> => {
  const t = getServerTranslations(locale ?? "en").smsTranslations.suggestionAcknowledged;

  return t.acknowledged({
    parentName: sanitizeSms(data.parentName),
    suggestionTitle: sanitizeSms(data.suggestionTitle),
  });
};
