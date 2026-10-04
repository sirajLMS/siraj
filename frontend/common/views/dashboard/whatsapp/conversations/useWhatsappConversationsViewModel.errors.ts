import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { logger } from "@/frontend/common/utils/logger";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

/**
 * Service-level domain errors reach the client with an already-localized
 * message on the GraphQL error; codes select the dedicated translated string
 * first, then the localized server message, then the generic fallback.
 */
function graphqlErrorCode(error: unknown): string | null {
  if (!CombinedGraphQLErrors.is(error)) {
    return null;
  }
  const code: unknown = error.errors[0]?.extensions?.code;
  return typeof code === "string" ? code : null;
}

function localizedServerMessage(error: unknown): string | null {
  if (!CombinedGraphQLErrors.is(error)) {
    return null;
  }
  const message = error.errors[0]?.message;
  return typeof message === "string" && message !== "" ? message : null;
}

export function mapDomainError(
  error: unknown,
  table: Record<string, (labels: ErrorsLabels) => string>,
  labels: ErrorsLabels,
  fallback: string,
  logContext: string
): string {
  const code = graphqlErrorCode(error);
  if (code !== null) {
    const resolve = table[code];
    if (resolve) {
      return resolve(labels);
    }
  }
  const serverMessage = localizedServerMessage(error);
  if (serverMessage !== null) {
    return serverMessage;
  }
  logger.warn(logContext, { message: error instanceof Error ? error.message : String(error) });
  return fallback;
}

/** Translated copy for send failures keyed by DomainError extensions.code. */
export function mapSendError(error: unknown, labels: ErrorsLabels): string {
  return mapDomainError(
    error,
    {
      WHATSAPP_RECIPIENT_NOT_ALLOWED: l => l.whatsappRecipientNotAllowed,
      WHATSAPP_OUTSIDE_SERVICE_WINDOW: l => l.whatsappOutsideServiceWindow,
      WHATSAPP_TEMPLATE_REQUIRED: l => l.whatsappTemplateRequired,
      WHATSAPP_MESSAGE_REQUIRED: l => l.whatsappMessageRequired,
      WHATSAPP_TEMPLATES_FETCH_FAILED: l => l.whatsappTemplatesFetchFailed,
      WHATSAPP_TEMPLATE_PARAMS_MISMATCH: l => l.whatsappTemplateParamsMismatch,
    },
    labels,
    labels.whatsappConversationSendFailed,
    "WhatsApp conversation send failed"
  );
}

/** Translated copy for registry add failures keyed by DomainError extensions.code. */
export const RECIPIENT_ADD_ERROR_TABLE: Record<string, (labels: ErrorsLabels) => string> = {
  WHATSAPP_RECIPIENT_LIMIT_REACHED: l => l.whatsappRecipientLimitReached,
  WHATSAPP_RECIPIENT_CONFLICT: l => l.whatsappRecipientConflict,
};
