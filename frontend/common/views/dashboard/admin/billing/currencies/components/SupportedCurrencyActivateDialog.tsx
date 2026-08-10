"use client";

import { useMutation } from "@apollo/client/react";
import {
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Stack,
  TextField,
} from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEffect, useMemo } from "react";
import { type Control, Controller, type FieldErrors, useForm, useWatch } from "react-hook-form";
import { CountryAutocomplete } from "@/frontend/common/components/ui/input/countrySelect/CountryAutocomplete";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { CountryCode, type CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { activateSupportedCurrencyMutationDocument } from "@/frontend/common/graphql/sharedDocuments/billing/currency-catalog.documents";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";
import { type CountryType, countries } from "@/frontend/common/lib/locale";
import { logger } from "@/frontend/common/utils/logger";
import type { SupportedCurrencyRow } from "@/frontend/common/views/dashboard/admin/billing/currencies/useSupportedCurrenciesViewModel";
import { EntityFormDialogActions } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/EntityFormDialogActions";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { SupportedCurrenciesLabels } from "@/shared/locale/types";

const FORM_ID = "supported-currency-activate-form";

const VALID_COUNTRY_CODES = new Set(Object.values(CountryCode) as readonly string[]);

function isCountryCode(value: string): value is CountryCode {
  return VALID_COUNTRY_CODES.has(value);
}

function toCountryCodeOrEmpty(value: string | null | undefined): CountryCode | "" {
  if (value && isCountryCode(value)) return value;
  return "";
}

type ActivateFormValues = {
  code: CurrencyCode | "";
  symbol: string;
  countryCode: CountryCode | "";
  decimals: string;
  sortOrder: string;
};

const defaultValues = (): ActivateFormValues => ({
  code: "",
  symbol: "",
  countryCode: "",
  decimals: "",
  sortOrder: "",
});

export interface SupportedCurrencyActivateDialogProps {
  readonly open: boolean;
  readonly row: SupportedCurrencyRow | null;
  readonly onClose: () => void;
  readonly onSaved: () => Promise<void>;
  /**
   * Currency codes already activated in the supported_currencies table. The
   * selector filters these out so operators can only pick currencies that are
   * not yet supported. The currently-edited row's code is always kept visible
   * (the field is disabled in edit mode anyway).
   */
  readonly excludedCodes?: readonly CurrencyCode[];
}

function resolveCountry(code: string | null | undefined): CountryType | undefined {
  if (!code) return undefined;
  return countries.find(country => country.code === code);
}

type ActivateCurrencyFormFieldsProps = {
  readonly control: Control<ActivateFormValues>;
  readonly errors: FieldErrors<ActivateFormValues>;
  readonly isEdit: boolean;
  readonly excludedCodes?: readonly CurrencyCode[];
  readonly t: SupportedCurrenciesLabels;
};

function ActivateCurrencyFormFields({ control, errors, isEdit, excludedCodes, t }: ActivateCurrencyFormFieldsProps) {
  return (
    <>
      <Controller
        name="code"
        control={control}
        rules={{ required: t.codeRequired }}
        render={({ field }) => (
          <CurrencySelect
            currency={field.value ? (getCurrencyByCode(field.value) ?? null) : null}
            setCurrencyAction={(currency: CurrencyOption) => field.onChange(currency.code)}
            onClearAction={() => field.onChange("")}
            label={t.currencyField}
            fullWidth
            required
            disabled={isEdit}
            excludedCodes={excludedCodes}
            error={Boolean(errors.code)}
            helperText={errors.code?.message}
          />
        )}
      />

      <Controller
        name="symbol"
        control={control}
        rules={{ required: t.symbolRequired }}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            label={t.symbolField}
            fullWidth
            required
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
          />
        )}
      />

      <Controller
        name="countryCode"
        control={control}
        render={({ field }) => (
          <CountryAutocomplete
            country={resolveCountry(field.value)}
            onChangeAction={country => field.onChange(country.code)}
            onClearAction={() => field.onChange("")}
            label={t.countryField}
            fullWidth
          />
        )}
      />

      <Controller
        name="decimals"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={t.decimalsField}
            type="number"
            fullWidth
            slotProps={{ htmlInput: { min: 0, max: 4 } }}
          />
        )}
      />

      <Controller
        name="sortOrder"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={t.sortOrderField}
            type="number"
            fullWidth
            slotProps={{ htmlInput: { min: 0 } }}
          />
        )}
      />

      <FormControl fullWidth>
        <FormControlLabel control={<Checkbox checked readOnly />} label={t.active} />
      </FormControl>
    </>
  );
}

function useActivateCurrencyDialog({ open, row, onClose, onSaved }: SupportedCurrencyActivateDialogProps) {
  const t = useAppTranslation(Translation.Dashboard.BillingSupportedCurrencies);
  const notifications = useNotifications();
  const isEdit = Boolean(row?.code);

  const [activateCurrency, { loading: saving }] = useMutation(activateSupportedCurrencyMutationDocument);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ActivateFormValues>({
    defaultValues: defaultValues(),
  });

  const selectedCode = useWatch({ control, name: "code" }) ?? "";
  const currentSymbol = useWatch({ control, name: "symbol" }) ?? "";

  useEffect(() => {
    if (!open) return;
    if (!row) {
      reset(defaultValues());
      return;
    }
    reset({
      code: row.code,
      symbol: row.symbol,
      countryCode: toCountryCodeOrEmpty(row.countryCode),
      decimals: "",
      sortOrder: "",
    });
  }, [open, reset, row]);

  const title = useMemo(() => (isEdit ? t.editTitle : t.activateTitle), [isEdit, t]);

  useEffect(() => {
    if (!selectedCode) return;
    const catalogEntry: CurrencyOption | undefined = getCurrencyByCode(selectedCode);
    if (catalogEntry && !currentSymbol) {
      setValue("symbol", catalogEntry.symbol);
      setValue("countryCode", toCountryCodeOrEmpty(catalogEntry.countryCode));
    }
  }, [selectedCode, currentSymbol, setValue]);

  const onSubmit = handleSubmit(async values => {
    if (!values.code) {
      notifications.show(t.codeRequired, { severity: "error" });
      return;
    }
    if (!values.symbol.trim()) {
      notifications.show(t.symbolRequired, { severity: "error" });
      return;
    }
    try {
      await activateCurrency({
        variables: {
          input: {
            code: values.code,
            symbol: values.symbol.trim(),
            countryCode: values.countryCode || null,
            decimals: values.decimals ? Number(values.decimals) : null,
            sortOrder: values.sortOrder ? Number(values.sortOrder) : null,
          },
        },
      });
      await onSaved();
    } catch (error) {
      logger.error("Failed to save supported currency", { error });
      notifications.show(t.saveError, { severity: "error" });
    }
  });

  return { t, saving, isEdit, control, errors, title, onSubmit, onClose };
}

export function SupportedCurrencyActivateDialog({
  open,
  row,
  onClose,
  onSaved,
  excludedCodes,
}: Readonly<SupportedCurrencyActivateDialogProps>) {
  const {
    t,
    saving,
    isEdit,
    control,
    errors,
    title,
    onSubmit,
    onClose: handleClose,
  } = useActivateCurrencyDialog({ open, row, onClose, onSaved, excludedCodes });

  return (
    <Dialog open={open} onClose={saving ? undefined : handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack
          id={FORM_ID}
          component="form"
          spacing={2}
          sx={{ pt: 1 }}
          onSubmit={event => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <ActivateCurrencyFormFields
            control={control}
            errors={errors}
            isEdit={isEdit}
            excludedCodes={excludedCodes}
            t={t}
          />
        </Stack>
      </DialogContent>
      <EntityFormDialogActions
        formId={FORM_ID}
        cancelLabel={t.cancel}
        saveLabel={t.save}
        onClose={handleClose}
        isLoading={saving}
      />
    </Dialog>
  );
}
