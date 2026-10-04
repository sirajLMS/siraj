import { WhatsappAccountPurpose } from "@/backend/enum/whatsapp/whatsapp-account.enum";
import { logger } from "@/backend/lib";
import type {
  CommunicationPayload,
  NotificationEntityKind,
  NotificationMetadata,
  WhatsappTemplateComponent,
  WhatsappTemplateMetadata,
} from "@/backend/types";

const NOTIFICATION_ENTITY_KINDS: readonly NotificationEntityKind[] = [
  "invoice",
  "class",
  "student",
  "complaint",
  "suggestion",
  "paymentMethod",
  "schedule",
  "lessonReport",
];

/** Type guard: narrows an untyped `metadata` blob to a valid `NotificationMetadata`. */
function isNotificationMetadata(metadata: unknown): metadata is NotificationMetadata {
  if (metadata === null || typeof metadata !== "object") return false;
  const entityKind = Reflect.get(metadata, "entityKind");
  const entityId = Reflect.get(metadata, "entityId");
  if (typeof entityKind !== "string" || typeof entityId !== "string") {
    return false;
  }
  return NOTIFICATION_ENTITY_KINDS.some(kind => kind === entityKind);
}

export function asNotificationMetadata(metadata: Record<string, unknown> | undefined): NotificationMetadata | null {
  return isNotificationMetadata(metadata) ? metadata : null;
}

/** Type guard: narrows an untyped value to `Record<string, string>` (for push `data`). */
export function isStringRecord(value: unknown): value is Record<string, string> {
  if (value === null || typeof value !== "object") return false;
  return Object.values(value).every(v => typeof v === "string");
}

const WHATSAPP_PURPOSE_VALUES: ReadonlySet<string> = new Set(Object.values(WhatsappAccountPurpose));

function isWhatsappAccountPurposeValue(value: unknown): value is WhatsappAccountPurpose {
  return typeof value === "string" && WHATSAPP_PURPOSE_VALUES.has(value);
}

/**
 * Type guard: validates that an untyped value matches `WhatsappTemplateMetadata`.
 * Avoids unsafe `as` assertions by validating each property at runtime.
 */
export function isWhatsappTemplateMetadata(value: unknown): value is WhatsappTemplateMetadata {
  if (value === null || typeof value !== "object") return false;
  const name = Reflect.get(value, "name");
  if (typeof name !== "string") return false;
  const languageCode = Reflect.get(value, "languageCode");
  if (languageCode != null && typeof languageCode !== "string") {
    return false;
  }
  const purpose = Reflect.get(value, "purpose");
  if (purpose != null && !isWhatsappAccountPurposeValue(purpose)) return false;
  const paramsOrder = Reflect.get(value, "paramsOrder");
  if (paramsOrder !== undefined) {
    if (!Array.isArray(paramsOrder)) return false;
    if (!paramsOrder.every(p => typeof p === "string")) return false;
  }
  return true;
}

function stringifyWhatsappArrayItem(item: unknown): string {
  if (item == null) {
    return "";
  }
  if (typeof item === "string") {
    return item;
  }
  if (typeof item === "number" || typeof item === "boolean" || typeof item === "bigint") {
    return item.toString();
  }
  return JSON.stringify(item);
}

/** Safely stringifies a template param value, avoiding `[object Object]` for objects. */
function stringifyWhatsappParam(paramValue: unknown): string {
  if (paramValue == null) {
    return "";
  }
  if (Array.isArray(paramValue)) {
    return paramValue.map(stringifyWhatsappArrayItem).join(", ");
  }
  if (typeof paramValue === "object") {
    return JSON.stringify(paramValue);
  }
  return typeof paramValue === "string" ? paramValue : JSON.stringify(paramValue);
}

/**
 * Builds the WhatsApp body component from the template's `paramsOrder`, reading
 * each parameter from `payload.metadata`. Missing params are substituted with an
 * empty string and logged so data-integrity gaps stay observable.
 */
export function buildWhatsappTemplateComponents(
  templateRaw: WhatsappTemplateMetadata,
  payload: CommunicationPayload
): WhatsappTemplateComponent[] | undefined {
  if (!templateRaw.paramsOrder) {
    return undefined;
  }
  return templateRaw.paramsOrder.map(paramName => {
    const paramValue = payload.metadata?.[paramName];
    if (paramValue == null || paramValue === "") {
      logger.warn("dispatchWhatsapp: missing template param substituted with empty string", {
        paramName,
        userId: payload.userId,
        eventType: payload.eventType,
        templateName: templateRaw.name,
      });
    }
    return {
      type: "body" as const,
      parameters: [
        {
          type: "text" as const,
          text: stringifyWhatsappParam(paramValue),
        },
      ],
    };
  });
}
