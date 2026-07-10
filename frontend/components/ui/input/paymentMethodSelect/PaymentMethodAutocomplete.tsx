"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { PaymentMethodOptionRow } from "@/frontend/components/ui/input/paymentMethodSelect/PaymentMethodOptionRow";
import {
  getPaymentMethodAutocompletePaperSlotProps,
  getPaymentMethodAutocompletePopperSlotProps,
} from "@/frontend/components/ui/input/paymentMethodSelect/paymentMethodAutocompletePopper";
import type { PaymentMethodType } from "@/frontend/graphql/generated/gql/graphql-types";
import { getPaymentMethodCatalogOptionLabel, type PaymentMethodCatalogOption } from "@/frontend/lib/payment-method";

export type PaymentMethodAutocompleteProps = {
  readonly option?: PaymentMethodCatalogOption | null;
  readonly options: readonly PaymentMethodCatalogOption[];
  readonly onChangeAction: (option: PaymentMethodCatalogOption) => void;
  readonly type?: PaymentMethodType | null;
  readonly autoComplete?: string;
  readonly fullWidth?: boolean;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly placeholder?: string;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly onBlurAction?: () => void;
  readonly style?: React.CSSProperties;
  readonly open?: boolean;
  readonly onOpenAction?: () => void;
  readonly onCloseAction?: () => void;
  readonly autoFocus?: boolean;
  readonly allowedSlugs?: readonly string[];
  readonly matchAnchorWidth?: boolean;
  readonly disablePortal?: boolean;
  readonly listAttached?: boolean;
  readonly showSlug?: boolean;
};

const filterOptions = createFilterOptions<PaymentMethodCatalogOption>({
  matchFrom: "any",
  stringify: option => `${option.displayName} ${option.slug}`,
});

export const PaymentMethodAutocomplete: React.FC<PaymentMethodAutocompleteProps> = ({
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
}: PaymentMethodAutocompleteProps): React.ReactNode => {
  const t = useTranslations("ui.paymentMethod.select");
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = openProp ?? internalOpen;

  const options = useMemo(() => {
    if (!allowedSlugs || allowedSlugs.length === 0) {
      return allOptionsProp;
    }
    return allOptionsProp.filter(entry => allowedSlugs.includes(entry.slug));
  }, [allOptionsProp, allowedSlugs]);

  const getOptionLabel = useCallback(
    (entry: PaymentMethodCatalogOption) => getPaymentMethodCatalogOptionLabel(entry),
    []
  );

  const showRequiredError = Boolean(required) && !option;
  const showError = Boolean(error) || showRequiredError;
  const resolvedHelperText = helperText ?? (showRequiredError ? t("required") : undefined);

  return (
    <Autocomplete<PaymentMethodCatalogOption, false, false, false>
      fullWidth={fullWidth}
      options={options}
      autoHighlight
      disabled={disabled}
      open={isOpen}
      onOpen={() => {
        if (openProp === undefined) {
          setInternalOpen(true);
        }
        onOpenAction?.();
      }}
      onClose={() => {
        if (openProp === undefined) {
          setInternalOpen(false);
        }
        onCloseAction?.();
      }}
      value={option ?? null}
      sx={{
        ...style,
        ...(listAttached && {
          "& .MuiOutlinedInput-root": {
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            ...(isOpen && {
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }),
          },
        }),
      }}
      onChange={(_, newValue) => {
        if (newValue) {
          onChangeAction(newValue);
        }
      }}
      onBlur={onBlur}
      isOptionEqualToValue={(left, right) => left.id === right.id}
      getOptionLabel={getOptionLabel}
      filterOptions={filterOptions}
      slotProps={{
        popper: getPaymentMethodAutocompletePopperSlotProps({
          matchAnchorWidth,
          disablePortal: disablePortal || listAttached,
          listAttached,
        }),
        paper: getPaymentMethodAutocompletePaperSlotProps(listAttached),
      }}
      renderOption={(props, entry) => {
        const { key, ...optionProps } = props;
        return (
          <Box key={key} component="li" sx={{ px: 2, py: 1 }} {...optionProps}>
            <PaymentMethodOptionRow option={entry} type={type} showSlug={showSlug} />
          </Box>
        );
      }}
      renderInput={params => {
        const resolvedLabel = listAttached ? undefined : (label ?? t("selectMethod"));
        const resolvedPlaceholder = listAttached
          ? (label ?? t("selectMethod"))
          : (placeholder ?? t("searchByNameOrSlug"));

        return (
          <TextField
            {...params}
            label={resolvedLabel}
            placeholder={resolvedPlaceholder}
            required={required}
            error={showError}
            helperText={resolvedHelperText}
            onBlur={onBlur}
            autoFocus={autoFocus}
            slotProps={{
              ...params.slotProps,
              input: {
                ...params.slotProps.input,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <SearchOutlinedIcon fontSize="small" />
                    </InputAdornment>
                    {option?.logoUrl ? (
                      <InputAdornment position="start">
                        <Avatar src={option.logoUrl} alt="" sx={{ width: 20, height: 20 }} />
                      </InputAdornment>
                    ) : null}
                    {params.slotProps.input?.startAdornment}
                  </>
                ),
                endAdornment: option ? (
                  <>
                    {params.slotProps.input?.endAdornment}
                    <InputAdornment position="end">
                      <Typography
                        component="span"
                        dir="ltr"
                        sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0 })}
                      >
                        {option.slug}
                      </Typography>
                    </InputAdornment>
                  </>
                ) : (
                  params.slotProps.input?.endAdornment
                ),
              },
              htmlInput: {
                ...params.slotProps.htmlInput,
                autoComplete,
              },
            }}
          />
        );
      }}
    />
  );
};

export type { PaymentMethodCatalogOption };
