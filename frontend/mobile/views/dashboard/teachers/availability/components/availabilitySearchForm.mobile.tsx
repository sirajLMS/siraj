// cspell:disable
"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, Button, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { outlinedInputSx, timeInputOutlinedSx } from "@/frontend/common/components/ui/form";
import { Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  AvailabilitySearchFormData,
  AvailabilitySearchFormProps,
  TimeFieldProps,
} from "@/frontend/common/views/dashboard/teachers/availability/types";
import { MobileAppTimePicker } from "@/frontend/mobile/components/ui/form/time";
import { useAppTranslation } from "@/shared/locale";

function TimeField({ label, name }: Readonly<TimeFieldProps>) {
  const { control } = useFormContext<AvailabilitySearchFormData>();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <MobileAppTimePicker
          value={field.value}
          onChange={field.onChange}
          slotProps={{
            textField: {
              label,
              fullWidth: true,
              size: "small",
              variant: "outlined",
              sx: timeInputOutlinedSx,
            },
          }}
        />
      )}
    />
  );
}

export function AvailabilitySearchFormMobile({ onSearch }: Readonly<AvailabilitySearchFormProps>) {
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
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: 2,
      }}
    >
      <TimeField label={t.from} name="fromTime" />
      <TimeField label={t.to} name="toTime" />

      <FormControl fullWidth size="small" sx={outlinedInputSx}>
        <InputLabel id="availability-gender-label-mobile" shrink>
          {t.gender}
        </InputLabel>
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <Select {...field} labelId="availability-gender-label-mobile" label={t.gender}>
              <MenuItem value="">{t.any}</MenuItem>
              <MenuItem value={Gender.Male}>{t.male}</MenuItem>
              <MenuItem value={Gender.Female}>{t.female}</MenuItem>
            </Select>
          )}
        />
      </FormControl>

      <Button
        type="submit"
        variant="contained"
        fullWidth
        startIcon={<SearchOutlined />}
        sx={theme => ({
          height: 48,
          borderRadius: 2,
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
