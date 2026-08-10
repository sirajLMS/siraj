// NEW FOR PLAN v5: shared payment-catalog presentational helpers lifted out
// of tier (`frontend/{mobile,desktop}/views/dashboard/admin/payment-catalogs/**`)
// per specs.md §3 N9 — no lowercase pure-data helpers in tier files.

import { IdentifierKind, type PaymentDirection } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PaymentCatalogsLabels } from "@/shared/locale";

/**
 * Resolve a presentational label for a `PaymentDirection` enum value as it
 * is stored on catalog rows (`PAYIN`/`PAYOUT`/nullish → "both"). The label
 * strings themselves come from the dashboard translations.
 */
export function resolvePaymentDirectionLabel(
  dir: PaymentDirection | string | null | undefined,
  labels: PaymentCatalogsLabels
): string {
  if (!dir) {
    return labels.notSet;
  }
  if (dir === "PAYIN") {
    return labels.directions.payin;
  }
  if (dir === "PAYOUT") {
    return labels.directions.payout;
  }
  return labels.directions.both;
}

/**
 * Resolve a presentational label for an `IdentifierKind` enum value as it is
 * stored on online-account catalog rows. The label strings come from the
 * dashboard translations.
 */
export function resolveIdentifierKindLabel(
  kind: IdentifierKind | null | undefined,
  labels: PaymentCatalogsLabels
): string {
  switch (kind) {
    case IdentifierKind.Email:
      return labels.identifierKinds.email;
    case IdentifierKind.Handle:
      return labels.identifierKinds.handle;
    case IdentifierKind.EmailOrHandle:
      return labels.identifierKinds.emailOrHandle;
    default:
      return labels.notSet;
  }
}
