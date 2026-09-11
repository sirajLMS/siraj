/**
 * Barrel for the Graph API request builders (v1 core set, Q1).
 *
 * Each `*.request.ts` file exports uniquely-named `build*Request` and
 * `parse*Response` functions so this barrel can use `export *` exclusively.
 * Internal helpers (`build-paginated-list-request`, `collect-all-pages`)
 * are intentionally NOT re-exported — they are implementation details.
 */
export * from "./embedded-signup.request";
export * from "./get-phone-number.request";
export * from "./list-message-templates.request";
export * from "./list-phone-numbers.request";
export * from "./request-smb-app-data.request";
export * from "./send-template-message.request";
export * from "./send-text-message.request";
