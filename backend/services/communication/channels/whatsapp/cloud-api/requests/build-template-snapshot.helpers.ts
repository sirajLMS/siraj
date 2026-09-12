/**
 * Shared mapping from Meta's raw message-template entries to the
 * `WhatsappTemplateSnapshot` value object. Unknown Meta status/category strings
 * are coerced to a safe fallback (with a warning) so Meta adding a new enum
 * value never breaks the sync or the workspace read.
 */
import { WhatsappTemplateCategory, WhatsappTemplateStatus } from "@/backend/enum/whatsapp/whatsapp.enum";
import { logger } from "@/backend/lib/logger";
import type { WhatsappMessageTemplate, WhatsappTemplateSnapshot } from "@/backend/types";

/** `{{n}}` positional parameter placeholder inside a template BODY text. */
const BODY_PARAM_PATTERN = /\{\{\d+\}\}/g;

export function isValidTemplateStatus(value: string): value is WhatsappTemplateStatus {
  return (Object.values(WhatsappTemplateStatus) as string[]).includes(value);
}

export function isValidTemplateCategory(value: string): value is WhatsappTemplateCategory {
  return (Object.values(WhatsappTemplateCategory) as string[]).includes(value);
}

/** BODY component text (null when the template has no BODY component). */
function templateBodyText(template: WhatsappMessageTemplate): string | null {
  const body = template.components?.find(component => component.type === "BODY");
  return body?.text ?? null;
}

/** Count of `{{n}}` placeholders in the BODY text; null when there is no BODY component. */
function templateBodyParamsCount(bodyText: string | null, hasBody: boolean): number | null {
  if (!hasBody || bodyText === null) {
    return hasBody ? 0 : null;
  }
  return bodyText.match(BODY_PARAM_PATTERN)?.length ?? 0;
}

/** Map collected templates to the snapshot type, coercing unknown enums. */
export function buildTemplateSnapshot(templates: readonly WhatsappMessageTemplate[]): WhatsappTemplateSnapshot[] {
  const now = new Date();
  return templates.map(template => {
    let status: WhatsappTemplateStatus;
    if (isValidTemplateStatus(template.status)) {
      status = template.status;
    } else {
      logger.warn(`whatsapp: unknown template status "${template.status}" from Meta — falling back to PENDING`, {
        templateId: template.id,
        templateName: template.name,
        status: template.status,
      });
      status = WhatsappTemplateStatus.PENDING;
    }
    let category: WhatsappTemplateCategory;
    if (isValidTemplateCategory(template.category)) {
      category = template.category;
    } else {
      logger.warn(`whatsapp: unknown template category "${template.category}" from Meta — falling back to MARKETING`, {
        templateId: template.id,
        templateName: template.name,
        category: template.category,
      });
      category = WhatsappTemplateCategory.MARKETING;
    }
    const bodyText = templateBodyText(template);
    const hasBody = template.components?.some(component => component.type === "BODY") ?? false;
    return {
      id: template.id,
      name: template.name,
      language: template.language.code,
      category,
      status,
      bodyText,
      bodyParamsCount: templateBodyParamsCount(bodyText, hasBody),
      lastSyncedAt: now,
    };
  });
}
