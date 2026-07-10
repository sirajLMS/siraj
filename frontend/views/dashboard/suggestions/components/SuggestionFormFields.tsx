"use client";

import { DescriptionOutlined, PersonOutlined } from "@mui/icons-material";
import { Box, InputAdornment, TextField, Typography } from "@mui/material";
import { Controller } from "react-hook-form";
import type { SuggestionFormFieldsProps } from "@/frontend/views/dashboard/suggestions/types/suggestionsView.types";

function FieldLabel({ children }: Readonly<{ children: string }>) {
  return (
    <Typography
      variant={children.length > 20 ? "titleLg" : "labelMd"}
      sx={theme => ({
        color: theme.palette.onSurfaceVariant,
        textTransform: children.length > 20 ? "none" : "uppercase",
        fontWeight: children.length > 20 ? 600 : 500,
      })}
    >
      {children}
    </Typography>
  );
}

export function SuggestionFormFields({ control, errors, labels, variant }: Readonly<SuggestionFormFieldsProps>) {
  const isMobile = variant === "mobile";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 3 : 4 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <FieldLabel>{labels.fullName}</FieldLabel>
        <Controller
          name="fullName"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              placeholder={labels.fullNamePlaceholder}
              fullWidth
              error={Boolean(errors.fullName)}
              helperText={errors.fullName?.message}
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
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <FieldLabel>{labels.suggestion}</FieldLabel>
        <Controller
          name="suggestion"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              placeholder={labels.suggestionPlaceholder}
              fullWidth
              multiline
              minRows={isMobile ? 4 : 6}
              error={Boolean(errors.suggestion)}
              helperText={errors.suggestion?.message}
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
    </Box>
  );
}
