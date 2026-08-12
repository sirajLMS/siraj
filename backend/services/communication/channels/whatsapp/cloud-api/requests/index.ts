/**
 * Barrel for the Graph API request builders (v1 core set, Q1).
 *
 * Each `*.request.ts` file exports uniquely-named `build*Request` and
 * `parse*Response` functions so this barrel can use `export *` exclusively.
 * Internal helpers (`build-paginated-list-request`, `collect-all-pages`)
 * are intentionally NOT re-exported — they are implementation details.
 */
// Named re-exports required: all four request files export identical-named
// `buildRequest` / `parseResponse` functions.  See:
//   .ai/plans/reexport-elimination/outcome/collisions-registry.md (Entry 1)
export {
  buildRequest as buildGetPhoneNumberRequest,
  parseResponse as parseGetPhoneNumberResponse,
} from "./get-phone-number.request";
export {
  buildRequest as buildListMessageTemplatesRequest,
  parseResponse as parseListMessageTemplatesResponse,
  collectAllTemplates,
} from "./list-message-templates.request";
export {
  buildRequest as buildListPhoneNumbersRequest,
  parseResponse as parseListPhoneNumbersResponse,
  collectAllPhoneNumbers,
} from "./list-phone-numbers.request";
export {
  buildRequest as buildSendTemplateMessageRequest,
  parseResponse as parseSendTemplateMessageResponse,
} from "./send-template-message.request";
