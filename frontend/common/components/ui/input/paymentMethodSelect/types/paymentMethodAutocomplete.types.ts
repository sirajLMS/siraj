// NEW FOR PLAN v5: migrated tier type lifts. Single shared props declaration
// for PaymentMethodAutocomplete across common + mobile + desktop tiers.

import type { AutocompleteSharedProps } from "@/frontend/common/components/ui/input/autocompleteSharedProps.types";
import type { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";

export type PaymentMethodAutocompleteProps = {
  readonly option?: PaymentMethodCatalogOption | null;
  readonly options: readonly PaymentMethodCatalogOption[];
  readonly onChangeAction: (option: PaymentMethodCatalogOption) => void;
  readonly type?: PaymentMethodType | null;
  readonly allowedSlugs?: readonly string[];
  readonly showSlug?: boolean;
} & AutocompleteSharedProps;
