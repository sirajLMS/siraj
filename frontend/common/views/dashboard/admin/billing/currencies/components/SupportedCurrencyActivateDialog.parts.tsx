import { Checkbox, FormControl, FormControlLabel, TextField } from "@mui/material";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import { CountryAutocomplete } from "@/frontend/common/components/ui/input/countrySelect/CountryAutocomplete";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";
import {
  type ActivateFormValues,
  resolveCountry,
} from "@/frontend/common/views/dashboard/admin/billing/currencies/components/SupportedCurrencyActivateDialog.helpers";
import type { SupportedCurrenciesLabels } from "@/shared/locale/types";

type ActivateCurrencyFormFieldsProps = {
  readonly control: Control<ActivateFormValues>;
  readonly errors: FieldErrors<ActivateFormValues>;
  readonly isEdit: boolean;
  readonly excludedCodes?: readonly CurrencyCode[];
  readonly t: SupportedCurrenciesLabels;
};

export function ActivateCurrencyFormFields({
  control,
  errors,
  isEdit,
  excludedCodes,
  t,
}: ActivateCurrencyFormFieldsProps) {
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
