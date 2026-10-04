import { createFilterOptions } from "@mui/material/Autocomplete";
import type * as React from "react";
import {
  createAutocompletePaperSlotProps,
  createAutocompletePopperSlotProps,
} from "@/frontend/common/components/ui/input/autocompletePopperSlotProps";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";

export const filterOptions = createFilterOptions<PaymentMethodCatalogOption>({
  matchFrom: "any",
  stringify: option => `${option.displayName} ${option.slug}`,
});

interface SlotPropsInputShape {
  readonly startAdornment?: React.ReactNode;
  readonly endAdornment?: React.ReactNode;
  readonly [key: string]: unknown;
}

interface SlotPropsShape {
  readonly input?: SlotPropsInputShape;
  readonly htmlInput?: Record<string, unknown>;
}

function isSlotPropsShape(value: unknown): value is SlotPropsShape {
  return typeof value === "object" && value !== null;
}

export function resolveSlotProps(slotProps: unknown): SlotPropsShape {
  if (!isSlotPropsShape(slotProps)) {
    return {};
  }
  return slotProps;
}

export function buildListAttachedSx(
  style: React.CSSProperties | undefined,
  listAttached: boolean,
  isOpen: boolean
): React.CSSProperties {
  if (!listAttached) {
    return style ?? {};
  }
  const listAttachedOverrides: Record<string, React.CSSProperties> = {
    "& .MuiOutlinedInput-root": {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      ...(isOpen
        ? {
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }
        : {}),
    },
  };
  return style ? { ...style, ...listAttachedOverrides } : listAttachedOverrides;
}

export function buildSlotProps(
  matchAnchorWidth: boolean,
  disablePortal: boolean,
  listAttached: boolean
): {
  readonly popper: ReturnType<typeof createAutocompletePopperSlotProps<PaymentMethodCatalogOption>>;
  readonly paper: ReturnType<typeof createAutocompletePaperSlotProps<PaymentMethodCatalogOption>>;
} {
  return {
    popper: createAutocompletePopperSlotProps<PaymentMethodCatalogOption>({
      matchAnchorWidth,
      disablePortal: disablePortal || listAttached,
      listAttached,
    }),
    paper: createAutocompletePaperSlotProps<PaymentMethodCatalogOption>(listAttached),
  };
}

export function filterByAllowedSlugs(
  allOptions: readonly PaymentMethodCatalogOption[],
  allowedSlugs: readonly string[] | undefined
): readonly PaymentMethodCatalogOption[] {
  if (!allowedSlugs || allowedSlugs.length === 0) {
    return allOptions;
  }
  return allOptions.filter(entry => allowedSlugs.includes(entry.slug));
}

export function resolveInputLabels(
  listAttached: boolean,
  label: string | undefined,
  placeholder: string | undefined,
  t: { readonly selectMethod: string; readonly searchByNameOrSlug: string }
): { readonly label: string | undefined; readonly placeholder: string | undefined } {
  return {
    label: listAttached ? undefined : (label ?? t.selectMethod),
    placeholder: listAttached ? (label ?? t.selectMethod) : (placeholder ?? t.searchByNameOrSlug),
  };
}

export function resolveErrorState(
  required: boolean | undefined,
  option: PaymentMethodCatalogOption | null | undefined,
  error: boolean | undefined,
  helperText: string | undefined,
  requiredText: string
): { readonly showError: boolean; readonly helperText: string | undefined } {
  const showRequiredError = Boolean(required) && !option;
  return {
    showError: Boolean(error) || showRequiredError,
    helperText: helperText ?? (showRequiredError ? requiredText : undefined),
  };
}
