"use client";

import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  buildListAttachedSx,
  buildSlotProps,
  filterByAllowedSlugs,
  resolveErrorState,
  resolveInputLabels,
} from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodAutocompleteShared.helpers";
import {
  useChangeHandlers,
  useInputFields,
} from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodAutocompleteShared.hooks";
import {
  AutocompleteContent,
  type RenderOption,
} from "@/frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodAutocompleteShared.parts";
import type { PaymentMethodAutocompleteProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/types";
import type { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface PaymentMethodAutocompleteSlots {
  readonly OptionRow: React.FC<{
    readonly option: PaymentMethodCatalogOption;
    readonly type?: PaymentMethodType | null;
    readonly showSlug: boolean;
  }>;
  /** sx applied to each option row <Box component="li"> wrapper (mobile uses larger touch targets) */
  readonly optionRowSx?: SxProps<Theme>;
  /** TextField `size` prop — mobile passes "small" for denser layout */
  readonly textFieldSize?: "small" | "medium";
  /** Default value for the `fullWidth` prop (mobile defaults to true) */
  readonly fullWidthDefault?: boolean;
}

function useRenderOption(
  slots: PaymentMethodAutocompleteSlots,
  type: PaymentMethodType | null | undefined,
  showSlug: boolean
): RenderOption {
  return useCallback(
    (props, entry) => {
      const { key, ...optionProps } = props;
      return (
        <Box key={key} component="li" sx={slots.optionRowSx ?? { px: 2, py: 1 }} {...optionProps}>
          <slots.OptionRow option={entry} type={type} showSlug={showSlug} />
        </Box>
      );
    },
    [slots, type, showSlug]
  );
}

export function PaymentMethodAutocompleteShared({
  option,
  options: allOptionsProp,
  onChangeAction,
  type,
  autoComplete = "off",
  fullWidth,
  required,
  disabled,
  label,
  placeholder,
  error,
  helperText,
  onBlurAction: onBlur,
  style,
  open: openProp,
  onOpenAction,
  onCloseAction,
  autoFocus,
  allowedSlugs,
  matchAnchorWidth = true,
  disablePortal = false,
  listAttached = false,
  showSlug = true,
  slots,
}: Readonly<PaymentMethodAutocompleteProps> & {
  readonly slots: PaymentMethodAutocompleteSlots;
}): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.PaymentMethod).select;
  // EXCEPTION: documented in frontend/common/components/ui/AGENTS.md (purely ephemeral autocomplete open state — allowed in viewport-agnostic primitives)
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = openProp ?? internalOpen;

  const resolvedFullWidth = fullWidth ?? slots.fullWidthDefault ?? false;
  const options = useMemo(() => filterByAllowedSlugs(allOptionsProp, allowedSlugs), [allOptionsProp, allowedSlugs]);
  const { handleOpen, handleClose, handleChange } = useChangeHandlers(
    openProp,
    onOpenAction,
    onCloseAction,
    onChangeAction,
    setInternalOpen
  );
  const renderOption = useRenderOption(slots, type, showSlug);
  const { showError, helperText: resolvedHelperText } = resolveErrorState(
    required,
    option,
    error,
    helperText,
    t.required
  );
  const { label: resolvedLabel, placeholder: resolvedPlaceholder } = resolveInputLabels(
    listAttached,
    label,
    placeholder,
    t
  );
  const listAttachedSx = useMemo(() => buildListAttachedSx(style, listAttached, isOpen), [style, listAttached, isOpen]);
  const autocompleteSlotProps = useMemo(
    () => buildSlotProps(matchAnchorWidth, disablePortal, listAttached),
    [matchAnchorWidth, disablePortal, listAttached]
  );
  const inputFields = useInputFields(
    option,
    resolvedLabel,
    resolvedPlaceholder,
    required,
    showError,
    resolvedHelperText,
    onBlur,
    autoFocus,
    autoComplete,
    slots.textFieldSize
  );

  return (
    <AutocompleteContent
      fullWidth={resolvedFullWidth}
      options={options}
      disabled={disabled}
      isOpen={isOpen}
      handleOpen={handleOpen}
      handleClose={handleClose}
      handleChange={handleChange}
      option={option}
      onBlur={onBlur}
      listAttachedSx={listAttachedSx}
      autocompleteSlotProps={autocompleteSlotProps}
      renderOption={renderOption}
      inputFields={inputFields}
    />
  );
}
