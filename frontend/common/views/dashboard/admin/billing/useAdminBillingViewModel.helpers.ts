import type { AdminInvoicesQueryVariables } from "@/frontend/common/graphql/generated/gql/graphql";
import { buildFxDisplayMessages, type FxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import { formatBillingDate } from "@/frontend/common/views/dashboard/billing/utils/formatBillingDate";
import type { ErrorsLabels } from "@/shared/locale";

export function formatDate(dateStr: string | null, locale: string): string {
  return formatBillingDate(dateStr, locale);
}

export function deriveInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0][0] ?? "";
    const second = parts.at(-1)?.[0] ?? "";
    return (first + second).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/** Composes the FX display message builders from the profile and errors namespaces. */
export function buildFxMessages(
  tProfile: {
    convertedAmount: (
      lockedAmount: string,
      lockedCurrency: string,
      convertedApprox: string,
      displayCurrency: string
    ) => string;
  },
  tErrors: ErrorsLabels,
  tProfileRoot: { convertedTotalApprox: (convertedApprox: string, displayCurrency: string) => string }
): FxDisplayMessages {
  return buildFxDisplayMessages({ convertedAmount: tProfile.convertedAmount }, tErrors, {
    convertedTotalApprox: tProfileRoot.convertedTotalApprox,
  });
}

/** Translates the 0-based UI page into the 1-based server pagination window. */
export function buildInvoicePaginationArgs(
  page: number,
  pageSize: number
): AdminInvoicesQueryVariables["paginationArgs"] {
  return {
    first: pageSize,
    page: page + 1,
    skip: null,
    after: null,
    before: null,
    last: null,
    maxCount: null,
  };
}
