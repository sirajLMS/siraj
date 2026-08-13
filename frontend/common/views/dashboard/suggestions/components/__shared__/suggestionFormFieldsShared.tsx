"use client";

import { DescriptionOutlined, PersonOutlined } from "@mui/icons-material";
import { Box, InputAdornment, TextField } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { Controller } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";
import type { SuggestionFormFieldsProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";

type FormFieldsProps = Readonly<Omit<SuggestionFormFieldsProps, "variant">>;

interface SuggestionFormFieldsSharedProps extends FormFieldsProps {
  /** Gap between form fields (desktop: 4, mobile: 3). */
  readonly fieldGap: number;
  /** Minimum rows for the suggestion textarea (desktop: 6, mobile: 4). */
  readonly suggestionMinRows: number;
  /** Box sx override for the outer container (optional). */
  readonly containerSx?: SxProps<Theme>;
}

export function SuggestionFormFieldsShared({
  control,
  errors,
  labels,
  fieldGap,
  suggestionMinRows,
  containerSx,
}: SuggestionFormFieldsSharedProps) {
  return (
    <Box sx={containerSx ?? { display: "flex", flexDirection: "column", gap: fieldGap }}>
      <Controller
        name="fullName"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={labels.fullName}
            placeholder={labels.fullNamePlaceholder}
            variant="outlined"
            fullWidth
            error={Boolean(errors.fullName)}
            helperText={errors.fullName?.message}
            sx={outlinedInputSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlined sx={theme => ({ color: theme.palette.primary.main })} />
                  </InputAdornment>
                ),
              },
              htmlInput: { autoComplete: "name" },
            }}
          />
        )}
      />

      <Controller
        name="suggestion"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={labels.suggestion}
            placeholder={labels.suggestionPlaceholder}
            variant="outlined"
            fullWidth
            multiline
            minRows={suggestionMinRows}
            error={Boolean(errors.suggestion)}
            helperText={errors.suggestion?.message}
            sx={outlinedInputSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}>
                    <DescriptionOutlined sx={theme => ({ color: theme.palette.primary.main })} />
                  </InputAdornment>
                ),
              },
              htmlInput: { autoComplete: "off" },
            }}
          />
        )}
      />
    </Box>
  );
}
