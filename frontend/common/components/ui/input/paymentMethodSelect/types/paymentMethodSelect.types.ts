// NEW FOR PLAN v5: migrated tier type lift for PaymentMethodSelect.

import type { AutocompleteSharedProps } from "@/frontend/common/components/ui/input/autocompleteSharedProps.types";
import type { PaymentMethodAutocompleteProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/types/paymentMethodAutocomplete.types";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";

export type PaymentMethodSelectProps = {
  readonly option?: PaymentMethodCatalogOption | null;
  readonly options: readonly PaymentMethodCatalogOption[];
  readonly setOptionAction: (option: PaymentMethodCatalogOption) => void;
  readonly allowedSlugs?: NonNullable<PaymentMethodAutocompleteProps["allowedSlugs"]>;
  readonly type?: NonNullable<PaymentMethodAutocompleteProps["type"]>;
  readonly showSlug?: boolean;
} & Omit<AutocompleteSharedProps, "matchAnchorWidth" | "disablePortal" | "listAttached">;
