// cspell:disable
"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, Button, MenuItem, Select, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import {
  labelSx,
  outlinedInputSx,
  timeInputOutlinedSx,
} from "@/frontend/common/components/ui/form/field/formFieldStyles";
import { AppTimePicker } from "@/frontend/common/components/ui/form/time/AppTimePicker";
import { Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  AvailabilitySearchFormData,
  AvailabilitySearchFormProps,
  TimeFieldProps,
} from "@/frontend/common/views/dashboard/teachers/availability/types";
import { useAppTranslation } from "@/shared/locale/client";

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

export function AvailabilitySearchForm({ onSearch }: Readonly<AvailabilitySearchFormProps>) {
  const t = useAppTranslation().dashboardTranslations.teacherAvailability;
  const { control, handleSubmit } = useFormContext<AvailabilitySearchFormData>();

  const onSubmit = (data: AvailabilitySearchFormData) => {
    onSearch?.(data);
  };

  return (
    <Box
      component="form"
      onSubmit={e => {
        handleSubmit(onSubmit)(e);
      }}
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
        gap: 3,
        alignItems: "end",
        p: 3,
      }}
    >
      <TimeField label={t.from} name="fromTime" />
      <TimeField label={t.to} name="toTime" />

      <Box>
        <Typography variant="labelMd" sx={labelSx}>
          {t.gender}
        </Typography>
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <Select {...field} fullWidth sx={outlinedInputSx}>
              <MenuItem value="">{t.any}</MenuItem>
              <MenuItem value={Gender.Male}>{t.male}</MenuItem>
              <MenuItem value={Gender.Female}>{t.female}</MenuItem>
            </Select>
          )}
        />
      </Box>

      <Button
        type="submit"
        variant="contained"
        startIcon={<SearchOutlined />}
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
        {t.submit}
      </Button>
    </Box>
  );
}
