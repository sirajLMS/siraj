"use client";

import { useQuery } from "@apollo/client/react";
import Autocomplete, { type AutocompleteRenderInputParams } from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";
import type {
  QuotaAutocompleteOption,
  QuotaAutocompleteSlotProps,
} from "@/frontend/common/components/ui/dialog/types/createRecurringClassDialogShared.types";
import { studentOpenQuotasQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useRouter } from "@/shared/i18n/navigation";

function formatValidUntil(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

export function QuotaAutocomplete({
  studentId,
  value,
  onChange,
  disabled,
  label,
  placeholder,
  noOptionsText,
  noOptionsCta,
  optionLabel,
}: Readonly<QuotaAutocompleteSlotProps>) {
  const router = useRouter();

  const { data, loading } = useQuery(studentOpenQuotasQueryDocument, {
    variables: { studentId },
    skip: !studentId,
  });

  const options = useMemo<readonly QuotaAutocompleteOption[]>(() => {
    if (!data?.studentOpenQuotas) return [];
    return data.studentOpenQuotas
      .map(quota => {
        if (!quota?.id) return null;
        return {
          id: quota.id,
          name: quota.name ?? "",
          remaining: quota.remaining ?? 0,
          validUntil: quota.validUntil ?? "",
        } satisfies QuotaAutocompleteOption;
      })
      .filter((opt): opt is QuotaAutocompleteOption => opt !== null);
  }, [data]);

  const selectedOption = useMemo<QuotaAutocompleteOption | null>(() => {
    if (!value) return null;
    return options.find(opt => opt.id === value) ?? null;
  }, [options, value]);

  const hasNoOptions = !loading && options.length === 0 && Boolean(studentId);

  const renderInput = (params: AutocompleteRenderInputParams) => (
    <TextField
      {...params}
      label={label}
      placeholder={placeholder}
      disabled={disabled}
      slotProps={{
        ...params.slotProps,
        htmlInput: {
          ...params.slotProps?.htmlInput,
          readOnly: true,
        },
      }}
    />
  );

  const renderNoOptionsText = () => {
    if (loading) return undefined;
    if (!studentId) return undefined;
    if (!hasNoOptions) return undefined;
    return (
      <Stack sx={{ gap: 1, p: 1 }}>
        <Typography variant="body2">{noOptionsText}</Typography>
        <Button
          size="small"
          color="primary"
          onClick={() => {
            router.push("/quotas/new");
          }}
        >
          {noOptionsCta}
        </Button>
      </Stack>
    );
  };

  const noOptionsTextRender = renderNoOptionsText();

  return (
    <Autocomplete
      options={[...options]}
      value={selectedOption}
      loading={loading}
      disabled={disabled || !studentId}
      getOptionLabel={(option: QuotaAutocompleteOption) =>
        optionLabel({
          id: option.id,
          name: option.name,
          remaining: option.remaining,
          validUntil: formatValidUntil(option.validUntil),
        })
      }
      isOptionEqualToValue={(option, val) => option.id === val.id}
      onChange={(_event, newValue: QuotaAutocompleteOption | null) => {
        onChange(newValue?.id ?? null);
      }}
      noOptionsText={noOptionsTextRender ?? noOptionsText}
      renderInput={renderInput}
    />
  );
}
