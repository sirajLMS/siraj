import { getBackendTranslations } from "@/backend/lib/intl";

type GenericTranslationFn = (key: string, values?: Record<string, unknown>) => string;

interface ComplaintResponseEmailData {
  readonly parentName: string;
  readonly complaintTitle: string;
  readonly responseText: string;
  readonly respondedAt: string;
  readonly complaintId: string;
}

interface SuggestionAcknowledgedEmailData {
  readonly parentName: string;
  readonly suggestionTitle: string;
  readonly suggestionText: string;
  readonly acknowledgedAt: string;
  readonly suggestionId: string;
}

export const renderComplaintResponseEmail = async (
  data: ComplaintResponseEmailData,
  locale?: string
): Promise<string> => {
  const t = (await getBackendTranslations({
    locale,
    namespace: "emails.complaintResponse",
  })) as GenericTranslationFn;

  const subject = t("subject", { complaintTitle: data.complaintTitle });
  const greeting = t("greeting", { parentName: data.parentName });
  const body = t("body", { complaintTitle: data.complaintTitle });
  const responseLabel = t("responseLabel");
  const dateLabel = t("dateLabel");
  const footer = t("footer");

  return `
<!DOCTYPE html>
<html lang="${locale ?? "ar"}" dir="${locale === "en" ? "ltr" : "rtl"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background-color: #1976d2; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
    .content { padding: 24px; }
    .greeting { font-size: 16px; color: #333333; margin-bottom: 16px; }
    .message { font-size: 14px; color: #555555; line-height: 1.6; margin-bottom: 16px; }
    .response-box { background-color: #f0f7ff; border-left: 4px solid #1976d2; padding: 16px; margin: 16px 0; border-radius: 4px; }
    .response-box .label { font-size: 12px; color: #1976d2; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
    .response-box .text { font-size: 14px; color: #333333; line-height: 1.6; }
    .meta { font-size: 12px; color: #888888; margin-top: 16px; }
    .footer { background-color: #f5f5f5; padding: 16px 24px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${subject}</h1>
    </div>
    <div class="content">
      <p class="greeting">${greeting}</p>
      <p class="message">${body}</p>
      <div class="response-box">
        <div class="label">${responseLabel}</div>
        <div class="text">${data.responseText}</div>
      </div>
      <p class="meta">${dateLabel}: ${data.respondedAt}</p>
    </div>
    <div class="footer">
      ${footer}
    </div>
  </div>
</body>
</html>`.trim();
};

export const renderSuggestionAcknowledgedEmail = async (
  data: SuggestionAcknowledgedEmailData,
  locale?: string
): Promise<string> => {
  const t = (await getBackendTranslations({
    locale,
    namespace: "emails.suggestionAcknowledged",
  })) as GenericTranslationFn;

  const subject = t("subject");
  const greeting = t("greeting", { parentName: data.parentName });
  const body = t("body");
  const suggestionLabel = t("suggestionLabel");
  const dateLabel = t("dateLabel");
  const footer = t("footer");

  return `
<!DOCTYPE html>
<html lang="${locale ?? "ar"}" dir="${locale === "en" ? "ltr" : "rtl"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background-color: #2e7d32; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
    .content { padding: 24px; }
    .greeting { font-size: 16px; color: #333333; margin-bottom: 16px; }
    .message { font-size: 14px; color: #555555; line-height: 1.6; margin-bottom: 16px; }
    .suggestion-box { background-color: #f0fff0; border-left: 4px solid #2e7d32; padding: 16px; margin: 16px 0; border-radius: 4px; }
    .suggestion-box .label { font-size: 12px; color: #2e7d32; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
    .suggestion-box .title { font-size: 16px; color: #333333; font-weight: 600; margin-bottom: 8px; }
    .suggestion-box .text { font-size: 14px; color: #555555; line-height: 1.6; }
    .meta { font-size: 12px; color: #888888; margin-top: 16px; }
    .footer { background-color: #f5f5f5; padding: 16px 24px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${subject}</h1>
    </div>
    <div class="content">
      <p class="greeting">${greeting}</p>
      <p class="message">${body}</p>
      <div class="suggestion-box">
        <div class="label">${suggestionLabel}</div>
        <div class="title">${data.suggestionTitle}</div>
        <div class="text">${data.suggestionText}</div>
      </div>
      <p class="meta">${dateLabel}: ${data.acknowledgedAt}</p>
    </div>
    <div class="footer">
      ${footer}
    </div>
  </div>
</body>
</html>`.trim();
};
