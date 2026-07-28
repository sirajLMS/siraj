// cspell:disable
"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, Button, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { outlinedInputSx, timeInputOutlinedSx } from "@/frontend/common/components/ui/form";
import { AppTimePicker } from "@/frontend/common/components/ui/form/time/AppTimePicker";
import { Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  AvailabilitySearchFormData,
  AvailabilitySearchFormProps,
  TimeFieldProps,
} from "@/frontend/common/views/dashboard/teachers/availability/types";

function TimeField({ label, name }: Readonly<TimeFieldProps>) {
  const { control } = useFormContext<AvailabilitySearchFormData>();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <AppTimePicker
          value={field.value}
          onChange={field.onChange}
          slotProps={{
            textField: {
              label,
              fullWidth: true,
              size: "medium",
              variant: "outlined",
              sx: timeInputOutlinedSx,
            },
          }}
        />
      )}
    />
  );
}

export function AvailabilitySearchFormDesktop({ onSearch, labels }: Readonly<AvailabilitySearchFormProps>) {
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
      <TimeField label={labels.from} name="fromTime" />
      <TimeField label={labels.to} name="toTime" />

      <FormControl fullWidth sx={outlinedInputSx}>
        <InputLabel id="availability-gender-label-desktop" shrink>
          {labels.gender}
        </InputLabel>
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <Select {...field} labelId="availability-gender-label-desktop" label={labels.gender}>
              <MenuItem value="">{labels.any}</MenuItem>
              <MenuItem value={Gender.Male}>{labels.male}</MenuItem>
              <MenuItem value={Gender.Female}>{labels.female}</MenuItem>
            </Select>
          )}
        />
      </FormControl>

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
        {labels.submit}
      </Button>
    </Box>
  );
}
