import type { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";

export type PaymentMethodOptionRowProps = {
  readonly option: PaymentMethodCatalogOption;
  readonly type?: PaymentMethodType | null;
  readonly showSlug?: boolean;
};
