/**
 * Barrel exports for the Meta Cloud API adapter layer.
 *
 * Re-exports the Graph API adapter, shared types/helpers, and the v1 core
 * set of request builders (Q1). Integration tests and the channel factory
 * import from this barrel rather than reaching into individual files.
 */

// Adapter (Task 5)
export { MetaCloudApiAdapter } from "@/backend/services/communication/channels/whatsapp/cloud-api/MetaCloudApiAdapter";
// Shared types + helpers (Task 4)
export {
  buildAuthHeaders,
  buildGraphUrl,
  extractMetaErrorCode,
  extractMetaErrorMessage,
  GraphApiError,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.types";
export {
  buildRequest as buildGetPhoneNumberRequest,
  parseResponse as parseGetPhoneNumberResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/get-phone-number.request";
export {
  buildRequest as buildListMessageTemplatesRequest,
  collectAllTemplates,
  parseResponse as parseListMessageTemplatesResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/list-message-templates.request";
export {
  buildRequest as buildListPhoneNumbersRequest,
  collectAllPhoneNumbers,
  parseResponse as parseListPhoneNumbersResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/list-phone-numbers.request";
// Request builders — v1 core set only (Q1)
export {
  buildRequest as buildSendTemplateMessageRequest,
  parseResponse as parseSendTemplateResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/send-template-message.request";
export type {
  GetPhoneNumberInput,
  GetPhoneNumberResult,
  GraphApiPaginatedResponse,
  GraphApiRequestContext,
  GraphApiRequestInit,
  ListMessageTemplatesInput,
  ListPhoneNumbersInput,
  SendTemplateMessageInput,
  SendTemplateMessageResult,
  WhatsappMessageTemplate,
  WhatsappPhoneNumber,
} from "@/backend/types/whatsapp/whatsapp-cloud-api.types";
