// cspell:disable
"use client";

import { Search as SearchIcon } from "@mui/icons-material";
import { Box, Button, MenuItem, Select, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import { AppTimePicker } from "@/frontend/components/ui/form/AppTimePicker";
import { labelSx, outlinedInputSx, timeInputOutlinedSx } from "@/frontend/components/ui/form/formFieldStyles";
import type { AvailabilitySearchFormData } from "../schemas/availabilitySearchSchema";

interface TimeFieldProps {
  readonly label: string;
  readonly name: "fromTime" | "toTime";
}

function TimeField({ label, name }: Readonly<TimeFieldProps>) {
  const { control } = useFormContext<AvailabilitySearchFormData>();
  return (
    <Box>
      <Typography variant="labelMd" sx={labelSx}>
        {label}
      </Typography>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <AppTimePicker
            value={field.value}
            onChange={field.onChange}
            slotProps={{
              textField: {
                fullWidth: true,
                size: "medium",
                variant: "outlined",
                sx: timeInputOutlinedSx,
              },
            }}
          />
        )}
      />
    </Box>
  );
}

export function AvailabilitySearchForm() {
  const t = useTranslations("dashboard.teacherAvailability");
  const { control, handleSubmit } = useFormContext<AvailabilitySearchFormData>();

  const onSubmit = (_data: AvailabilitySearchFormData) => {
    // In a real app, this would call a store action to filter the data
  };

  return (
    <Box
      component="form"
      onSubmit={e => {
        void handleSubmit(onSubmit)(e);
      }}
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
        gap: 3,
        alignItems: "end",
        p: 3,
      }}
    >
      <TimeField label={t("from")} name="fromTime" />
      <TimeField label={t("to")} name="toTime" />

      {/* Gender Filter */}
      <Box>
        <Typography variant="labelMd" sx={labelSx}>
          {t("gender")}
        </Typography>
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <Select {...field} fullWidth sx={outlinedInputSx}>
              <MenuItem value="any">{t("any")}</MenuItem>
              <MenuItem value="male">{t("male")}</MenuItem>
              <MenuItem value="female">{t("female")}</MenuItem>
            </Select>
          )}
        />
      </Box>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="contained"
        startIcon={<SearchIcon />}
        sx={theme => ({
          height: 56,
          borderRadius: 3,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.onPrimary,
          boxShadow: theme.palette.shadow.button,
          "&:hover": {
            backgroundColor: theme.palette.primary.dark,
            boxShadow: theme.palette.shadow.buttonHover,
          },
        })}
      >
        {t("submit")}
      </Button>
    </Box>
  );
}
