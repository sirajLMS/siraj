import type { WhatsappAccountsQuery } from "@/frontend/common/graphql/generated/gql/graphql";

/**
 * Page-index convention: the VM keeps the 0-based page expected by the shared
 * list pagination (`ListPaginationOptions` / DataGrid) and translates to
 * GraphQL `first`/`skip` — the same contract every other server-paginated
 * view uses. All pagination args must be present — MockLink matches variables
 * exactly.
 */
export function buildPaginationArgs(page: number, pageSize: number) {
  return { first: pageSize, skip: page * pageSize, after: null, before: null, last: null, page: null, maxCount: null };
}

/** Replaces a single `{variable}` placeholder in a translated template. */
export function withVar(template: string, variable: string, value: string): string {
  return template.replaceAll(`{${variable}}`, value);
}

type WhatsappAccountRow = NonNullable<WhatsappAccountsQuery["whatsappAccounts"]>[number];

/** Prefers the Meta display phone number, then the locale-matched display name, then the WABA id. */
export function resolveAccountLabel(account: WhatsappAccountRow, locale: string): string {
  if (account.displayPhoneNumber) {
    return account.displayPhoneNumber;
  }
  const localized = account.displayName?.[locale === "ar" ? "ar" : "en"];
  return localized ?? account.displayName?.en ?? account.wabaId ?? "";
}
