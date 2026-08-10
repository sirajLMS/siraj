"use client";

import { Box, Button, InputAdornment, TextField } from "@mui/material";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getCurrencyByCode, getCurrencySymbol } from "@/frontend/common/lib/currency";

export interface RecurringRateSectionLabels {
  readonly title: string;
  readonly hourlyRateLabel: string;
  readonly currencyLabel: string;
  readonly saveLabel: string;
  readonly clearLabel: string;
  readonly successMessage: string;
  readonly errorMessage: string;
}

export interface RecurringRateSectionProps {
  readonly hourlyRate: string | null;
  readonly rateCurrency: CurrencyCode | null;
  readonly saving: boolean;
  readonly error: string | null;
  readonly success: boolean;
  readonly labels: RecurringRateSectionLabels;
  readonly onSave: (hourlyRate: string | null, rateCurrency: CurrencyCode | null) => Promise<void>;
}

interface RateFormValues {
  readonly hourlyRate: string;
  readonly rateCurrency: string;
}

function isCurrencyCode(value: string): value is CurrencyCode {
  return (Object.values(CurrencyCode) as readonly string[]).includes(value);
}

export function RecurringRateSection({
  hourlyRate,
  rateCurrency,
  saving,
  error,
  success,
  labels,
  onSave,
}: Readonly<RecurringRateSectionProps>) {
  const { register, handleSubmit, setValue, control } = useForm<RateFormValues>({
    defaultValues: {
      hourlyRate: hourlyRate ?? "",
      rateCurrency: rateCurrency ?? "",
    },
  });

  useEffect(() => {
    setValue("hourlyRate", hourlyRate ?? "");
    setValue("rateCurrency", rateCurrency ?? "");
  }, [hourlyRate, rateCurrency, setValue]);

  const watchedCurrency = useWatch({ control, name: "rateCurrency" });
  const currencySymbol = watchedCurrency ? getCurrencySymbol(watchedCurrency) : "";

  const handleValidSubmit = async (data: RateFormValues) => {
    await onSave(data.hourlyRate || null, isCurrencyCode(data.rateCurrency) ? data.rateCurrency : null);
  };

  const handleClear = async () => {
    setValue("hourlyRate", "");
    setValue("rateCurrency", "");
    await onSave(null, null);
  };

  return (
    <SectionPanel title={labels.title}>
      <Box
        component="form"
        onSubmit={handleSubmit(handleValidSubmit)}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <TextField
          label={labels.hourlyRateLabel}
          fullWidth
          size="small"
          disabled={saving}
          {...register("hourlyRate")}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
            },
          }}
        />
        <CurrencySelect
          currency={watchedCurrency ? (getCurrencyByCode(watchedCurrency) ?? null) : null}
          setCurrencyAction={selected => {
            setValue("rateCurrency", selected.code);
          }}
          label={labels.currencyLabel}
          fullWidth
        />
        {error ? <Box sx={{ color: "error.main" }}>{labels.errorMessage}</Box> : null}
        {success && !error ? <Box sx={{ color: "success.main" }}>{labels.successMessage}</Box> : null}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button type="submit" variant="contained" disabled={saving}>
            {labels.saveLabel}
          </Button>
          <Button type="button" variant="outlined" disabled={saving} onClick={handleClear}>
            {labels.clearLabel}
          </Button>
        </Box>
      </Box>
    </SectionPanel>
  );
}
