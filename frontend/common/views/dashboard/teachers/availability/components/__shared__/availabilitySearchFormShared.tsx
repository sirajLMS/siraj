"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, Button, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { PickerValue } from "@mui/x-date-pickers/internals";
import type { ComponentType } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { outlinedInputSx, timeInputOutlinedSx } from "@/frontend/common/components/ui/form/field";
import { Gender } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  AvailabilitySearchFormData,
  AvailabilitySearchFormProps,
  TimeFieldProps,
} from "@/frontend/common/views/dashboard/teachers/availability/types";

export interface AvailabilitySearchFormSharedOptions {
  readonly TimePickerComponent: ComponentType<{
    readonly value?: PickerValue;
    readonly onChange?: (value: PickerValue) => void;
    readonly slotProps?: {
      readonly textField: {
        readonly label: string;
        readonly fullWidth: boolean;
        readonly size: "small" | "medium";
        readonly variant: "outlined";
        readonly sx: SxProps<Theme>;
      };
    };
  }>;
  readonly timePickerSize: "small" | "medium";
  readonly formLayoutSx: SxProps<Theme>;
  readonly formControlSize: "small" | "medium" | undefined;
  readonly genderLabelIdSuffix: string;
  readonly buttonHeight: number;
  readonly buttonBorderRadius: number;
  readonly buttonFullWidth: boolean;
}

export type AvailabilitySearchFormSharedProps = Readonly<AvailabilitySearchFormProps> & {
  readonly options: AvailabilitySearchFormSharedOptions;
};

function TimeField({
  label,
  name,
  options,
}: Readonly<TimeFieldProps & { options: AvailabilitySearchFormSharedOptions }>) {
  const { control } = useFormContext<AvailabilitySearchFormData>();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <options.TimePickerComponent
          value={field.value}
          onChange={field.onChange}
          slotProps={{
            textField: {
              label,
              fullWidth: true,
              size: options.timePickerSize,
              variant: "outlined",
              sx: timeInputOutlinedSx,
            },
          }}
        />
      )}
    />
  );
}

export function AvailabilitySearchFormShared({ onSearch, labels, options }: AvailabilitySearchFormSharedProps) {
  const { control, handleSubmit } = useFormContext<AvailabilitySearchFormData>();

  const onSubmit = (data: AvailabilitySearchFormData) => {
    onSearch?.(data);
  };

  const genderLabelId = `availability-gender-label-${options.genderLabelIdSuffix}`;

  return (
    <Box
      component="form"
      onSubmit={e => {
        void handleSubmit(onSubmit)(e);
      }}
      sx={options.formLayoutSx}
    >
      <TimeField label={labels.from} name="fromTime" options={options} />
      <TimeField label={labels.to} name="toTime" options={options} />

      <FormControl fullWidth size={options.formControlSize} sx={outlinedInputSx}>
        <InputLabel id={genderLabelId} shrink>
          {labels.gender}
        </InputLabel>
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <Select {...field} labelId={genderLabelId} label={labels.gender}>
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
        fullWidth={options.buttonFullWidth}
        startIcon={<SearchOutlined />}
        sx={theme => ({
          height: options.buttonHeight,
          borderRadius: options.buttonBorderRadius,
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
