// cspell:disable
"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, Button, MenuItem, Select, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  AvailabilitySearchFormData,
  AvailabilitySearchFormProps,
  TimeFieldProps,
} from "@/frontend/common/views/dashboard/teachers/availability/types";
import { MobileFieldWrapper, standardInputSx } from "@/frontend/mobile/components/ui/form/field";
import { MobileAppTimePicker } from "@/frontend/mobile/components/ui/form/time";
import { useAppTranslation } from "@/shared/locale";

function TimeField({ label, name }: Readonly<TimeFieldProps>) {
  const { control } = useFormContext<AvailabilitySearchFormData>();
  return (
    <MobileFieldWrapper label={label}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <MobileAppTimePicker
            value={field.value}
            onChange={field.onChange}
            slotProps={{
              textField: {
                fullWidth: true,
                size: "small",
                variant: "outlined",
                sx: standardInputSx,
              },
            }}
          />
        )}
      />
    </MobileFieldWrapper>
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

      <Box>
        <Typography variant="labelSm" sx={standardInputSx}>
          {t.gender}
        </Typography>
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <Select {...field} fullWidth size="small" sx={standardInputSx}>
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
