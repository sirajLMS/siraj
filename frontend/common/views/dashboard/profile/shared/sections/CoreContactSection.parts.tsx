"use client";

import { Stack, TextField } from "@mui/material";
import { Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { PhoneFormField, SectionPanel } from "@/frontend/common/components/ui";
import { TimezoneSelect } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import { toIanaTimezone } from "@/frontend/common/lib/timezone";
import type {
  CoreContactEditWithControlProps,
  CoreContactEditWithRegisterProps,
  CoreContactFormFields,
} from "@/frontend/common/views/dashboard/profile/shared/sections/CoreContactSection.types";

function isCoreContactFieldPath<T extends CoreContactFormFields & FieldValues>(value: string): value is FieldPath<T> {
  return typeof value === "string";
}

function coreContactFieldPath<T extends CoreContactFormFields & FieldValues>(name: string): FieldPath<T> {
  if (!isCoreContactFieldPath<T>(name)) {
    throw new Error(`Invalid core contact field path: ${name}`);
  }
  return name;
}

export function CoreContactEditSection<T extends CoreContactFormFields & FieldValues>({
  props,
  contactEditable,
}: {
  readonly props: CoreContactEditWithControlProps<T> | CoreContactEditWithRegisterProps;
  readonly contactEditable: boolean;
}) {
  const showTimezone = Boolean(props.timezoneLabel);

  return (
    <SectionPanel title={props.sectionTitle}>
      <Stack spacing={2}>
        {"control" in props ? (
          <PhoneFormField
            name={coreContactFieldPath<T>("phone")}
            control={props.control}
            label={props.phoneLabel}
            disabled={!contactEditable}
          />
        ) : (
          <TextField
            label={props.phoneLabel}
            fullWidth
            size="small"
            disabled={!contactEditable}
            {...props.register("phone")}
          />
        )}
        {showTimezone && "control" in props ? (
          <Controller
            name={coreContactFieldPath<T>("timezone")}
            control={props.control}
            render={({ field, fieldState }) => (
              <TimezoneSelect
                value={field.value ? toIanaTimezone(field.value) : null}
                onChangeAction={value => {
                  field.onChange(value ?? "");
                }}
                onBlurAction={field.onBlur}
                label={props.timezoneLabel}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                fullWidth
                disabled={!contactEditable}
              />
            )}
          />
        ) : null}
        {showTimezone && "register" in props ? (
          <TextField
            label={props.timezoneLabel}
            fullWidth
            size="small"
            disabled={!contactEditable}
            {...props.register("timezone")}
          />
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
