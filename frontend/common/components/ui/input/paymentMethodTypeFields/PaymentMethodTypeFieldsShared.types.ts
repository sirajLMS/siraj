import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import type { CurrencyCode, PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { CurrencyOption } from "@/frontend/common/lib/currency";
import type { CountryType } from "@/frontend/common/lib/locale";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";
import type { PaymentMethodTypeFieldsLabels } from "@/shared/locale/types/ui";

type LocalizedStringFormFieldSlot<T extends FieldValues = FieldValues> = React.ComponentType<{
  name: Path<T>;
  control: Control<T>;
  label: string;
  disabled?: boolean;
  required?: boolean;
  multiline?: boolean;
}>;

type CountryAutocompleteSlot = React.ComponentType<{
  country: CountryType | undefined;
  onChangeAction: (value: CountryType | null) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
}>;

type CurrencySelectSlot = React.ComponentType<{
  currency: CurrencyOption | null;
  setCurrencyAction: (value: CurrencyOption | null) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  allowedCodes?: readonly CurrencyCode[];
  fullWidth?: boolean;
}>;

type PaymentMethodSelectSlot = React.ComponentType<{
  option: PaymentMethodCatalogOption | null;
  options: readonly PaymentMethodCatalogOption[];
  setOptionAction: (option: PaymentMethodCatalogOption) => void;
  type: PaymentMethodType;
  label: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
}>;

type PhoneFormFieldSlot<T extends FieldValues = FieldValues> = React.ComponentType<{
  name: Path<T>;
  control: Control<T>;
  label: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
}>;

type TagInputSlot = React.ComponentType<{
  label: string;
  initialTags: string[];
  onChange: (tags: string[]) => void;
}>;

export interface PaymentMethodTypeFieldsSlots<T extends FieldValues = FieldValues> {
  LocalizedStringFormField: LocalizedStringFormFieldSlot<T>;
  CountryAutocomplete: CountryAutocompleteSlot;
  CurrencySelect: CurrencySelectSlot;
  PaymentMethodSelect: PaymentMethodSelectSlot;
  PhoneFormField: PhoneFormFieldSlot<T>;
  TagInput: TagInputSlot;
}

export interface PaymentMethodTypeFieldSharedOptions {
  stackSpacing?: number;
  textFieldSize?: "small" | "medium";
}

export interface PaymentMethodTypeFieldsContext<T extends FieldValues = FieldValues> {
  readonly type: PaymentMethodType;
  readonly control: Control<T>;
  readonly disabled: boolean;
  readonly detailsPrefix: string | undefined;
  readonly catalogPrefix: string | undefined;
  readonly allowedCurrencyCodes: readonly CurrencyCode[] | undefined;
  readonly showCatalogMetadata: boolean;
  readonly sizeProp: { readonly size?: "small" | "medium" };
  readonly stackSx: SxProps<Theme> | undefined;
  readonly stackSpacingProp: number | undefined;
  readonly tTypeFields: PaymentMethodTypeFieldsLabels;
  readonly slots: PaymentMethodTypeFieldsSlots<T>;
}
