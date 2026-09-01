"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, FormControl, FormHelperText } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { PickerValue } from "@mui/x-date-pickers/internals";
import type { ComponentType } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { PrimaryPageAction } from "@/frontend/common/components/ui/button";
import { timeInputOutlinedSx } from "@/frontend/common/components/ui/form/field";
import type { GenderSelectorProps } from "@/frontend/common/components/ui/input/genderSelector";
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
  readonly buttonHeight: number;
  readonly buttonFullWidth: boolean;
  readonly GenderSelectorComponent: ComponentType<GenderSelectorProps>;
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

function GenderField({
  labels,
  GenderSelectorComponent,
}: Readonly<
  Pick<AvailabilitySearchFormProps, "labels"> & { GenderSelectorComponent: ComponentType<GenderSelectorProps> }
>) {
  const { control } = useFormContext<AvailabilitySearchFormData>();
  return (
    <Controller
      name="gender"
      control={control}
      render={({ field, fieldState }) => (
        <FormControl fullWidth error={fieldState.error !== undefined}>
          <GenderSelectorComponent
            gender={field.value}
            setGenderAction={field.onChange}
            error={fieldState.error !== undefined}
            fullWidth
            allowEmpty
            labels={{
              title: labels.gender,
              any: labels.any,
              male: labels.male,
              female: labels.female,
            }}
          />
          {fieldState.error ? <FormHelperText>{fieldState.error.message}</FormHelperText> : null}
        </FormControl>
      )}
    />
  );
}

export function AvailabilitySearchFormShared({ onSearch, labels, options }: AvailabilitySearchFormSharedProps) {
  const { handleSubmit } = useFormContext<AvailabilitySearchFormData>();

  const onSubmit = (data: AvailabilitySearchFormData) => {
    onSearch?.(data);
  };

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

      <GenderField labels={labels} GenderSelectorComponent={options.GenderSelectorComponent} />

      <PrimaryPageAction
        type="submit"
        fullWidth={options.buttonFullWidth}
        startIcon={<SearchOutlined />}
        sx={{ height: options.buttonHeight }}
      >
        {labels.submit}
      </PrimaryPageAction>
    </Box>
  );
}
