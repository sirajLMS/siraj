import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { BillingManualLabels } from "@/shared/locale";

export interface InvoiceDraftSummaryCardProps {
  readonly labels: BillingManualLabels;
  readonly totalFormatted: string;
  readonly currency: CurrencyCode;
}
