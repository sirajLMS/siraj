"use client";

import { DescriptionOutlined, PersonOutlined } from "@mui/icons-material";
import { Box, InputAdornment, TextField } from "@mui/material";
import { Controller } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import type { SuggestionFormFieldsProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";

export function SuggestionFormFieldsMobile({
  control,
  errors,
  labels,
}: Readonly<Omit<SuggestionFormFieldsProps, "variant">>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
            minRows={4}
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
