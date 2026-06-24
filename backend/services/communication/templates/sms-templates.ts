import { getBackendTranslations } from "@/backend/lib/intl";

type GenericTranslationFn = (key: string, values?: Record<string, unknown>) => string;

interface UrgentComplaintResponseSmsData {
  readonly parentName: string;
  readonly complaintTitle: string;
  readonly responseSummary: string;
}

export const renderUrgentComplaintResponseSms = async (
  data: UrgentComplaintResponseSmsData,
  locale?: string
): Promise<string> => {
  const t = (await getBackendTranslations({
    locale,
    namespace: "sms.complaintResponse",
  })) as GenericTranslationFn;

  const message = t("urgentResponse", {
    parentName: data.parentName,
    complaintTitle: data.complaintTitle,
    responseSummary: data.responseSummary,
  });

  return message;
};

export const renderSuggestionAcknowledgedSms = async (
  data: { readonly parentName: string; readonly suggestionTitle: string },
  locale?: string
): Promise<string> => {
  const t = (await getBackendTranslations({
    locale,
    namespace: "sms.suggestionAcknowledged",
  })) as GenericTranslationFn;

  const message = t("acknowledged", {
    parentName: data.parentName,
    suggestionTitle: data.suggestionTitle,
  });

  return message;
};
