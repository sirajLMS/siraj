"use client";

import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, Grid, IconButton, InputAdornment, TextField, Tooltip } from "@mui/material";
import { useState } from "react";
import { type Control, Controller, type FieldErrors, type Path, useWatch } from "react-hook-form";
import { PasswordStrengthMeter } from "@/frontend/common/components/auth/__shared__/PasswordStrengthMeter";
import {
  fieldPath,
  getErrorMessage,
  type OnboardingFields,
  validationMessage,
} from "@/frontend/common/components/onboarding/sections/UserEntityFieldsSection.helpers";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";
import { PhoneFormField } from "@/frontend/common/components/ui/input";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import { TimezoneSelect } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import { toIanaTimezone } from "@/frontend/common/lib/timezone";
import { CurrencyControllerField } from "@/frontend/common/views/dashboard/profile/shared/CurrencyControllerField";
import type { UserEntityOnboardingLabels } from "@/shared/locale/types/onboarding/userEntity";

/**
 * Field primitives for the shared onboarding entity form: generic
 * text/phone/timezone/currency wrappers plus the dedicated password field.
 * Each field owns its own controller wiring so the section component stays a
 * thin composition.
 */

interface TextFieldWrapperProps<T extends OnboardingFields> {
  readonly control: Control<T>;
  readonly errors: FieldErrors<T>;
  readonly labels: UserEntityOnboardingLabels;
  readonly fieldName: Path<T>;
  readonly labelKey: keyof UserEntityOnboardingLabels["fields"];
  readonly placeholderKey: keyof UserEntityOnboardingLabels["placeholders"];
  readonly required?: boolean;
  readonly type?: string;
  readonly errorKey?: keyof T;
}

function TextFieldWrapper<T extends OnboardingFields>({
  control,
  errors,
  labels,
  fieldName,
  labelKey,
  placeholderKey,
  required = true,
  type = "text",
  errorKey,
}: TextFieldWrapperProps<T>) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Controller
        name={fieldName}
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={labels.fields[labelKey]}
            placeholder={labels.placeholders[placeholderKey]}
            required={required}
            type={type}
            error={errorKey ? !!errors[errorKey] : false}
            helperText={validationMessage(labels, errorKey ? getErrorMessage(errors[errorKey]) : undefined)}
            fullWidth
            sx={outlinedInputSx}
          />
        )}
      />
    </Grid>
  );
}

interface FieldComponentProps<T extends OnboardingFields> {
  readonly control: Control<T>;
  readonly errors: FieldErrors<T>;
  readonly labels: UserEntityOnboardingLabels;
}

interface SimpleTextFieldProps<T extends OnboardingFields> extends FieldComponentProps<T> {
  readonly fieldName: string;
  readonly labelKey: keyof UserEntityOnboardingLabels["fields"];
  readonly placeholderKey: keyof UserEntityOnboardingLabels["placeholders"];
  readonly errorKey: keyof T;
  readonly type?: string;
}

function SimpleTextField<T extends OnboardingFields>({ fieldName, ...props }: SimpleTextFieldProps<T>) {
  return <TextFieldWrapper {...props} fieldName={fieldPath<T>(fieldName)} />;
}

export function NameField<T extends OnboardingFields>(props: FieldComponentProps<T>) {
  return <SimpleTextField {...props} fieldName="name" labelKey="fullName" placeholderKey="fullName" errorKey="name" />;
}

export function EmailField<T extends OnboardingFields>(props: FieldComponentProps<T>) {
  return (
    <SimpleTextField
      {...props}
      fieldName="email"
      labelKey="email"
      placeholderKey="email"
      errorKey="email"
      type="email"
    />
  );
}

// PasswordField is a DEDICATED component (not built on the generic text
// wrapper) because it needs: type="password" (masking — the generic default
// "text" rendered passwords in plaintext), a show/hide toggle, and a live
// PasswordStrengthMeter below the field.

interface AvatarFieldProps<T extends OnboardingFields> {
  readonly control: Control<T>;
  readonly labels: UserEntityOnboardingLabels;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
}

export function AvatarField<T extends OnboardingFields>({ control, labels, onUploadAvatar }: AvatarFieldProps<T>) {
  const avatarField = fieldPath<T>("avatarUrl");
  return (
    <Grid size={{ xs: 12 }}>
      <AvatarImageField
        control={control}
        name={avatarField}
        label={labels.fields.avatar}
        onUploadAvatar={onUploadAvatar}
      />
    </Grid>
  );
}

interface PhoneFieldProps<T extends OnboardingFields> {
  readonly control: Control<T>;
  readonly errors: FieldErrors<T>;
  readonly labels: UserEntityOnboardingLabels;
  readonly phoneRequired?: boolean;
}

export function PhoneField<T extends OnboardingFields>({ control, errors, labels, phoneRequired }: PhoneFieldProps<T>) {
  const phoneField = fieldPath<T>("phone");
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <PhoneFormField
        name={phoneField}
        control={control}
        label={labels.fields.phone}
        required={phoneRequired}
        placeholder={labels.placeholders.phone}
        error={!!errors.phone}
        helperText={validationMessage(labels, getErrorMessage(errors.phone))}
      />
    </Grid>
  );
}

interface TimezoneFieldProps<T extends OnboardingFields> {
  readonly control: Control<T>;
  readonly errors: FieldErrors<T>;
  readonly labels: UserEntityOnboardingLabels;
}

export function TimezoneField<T extends OnboardingFields>({ control, errors, labels }: TimezoneFieldProps<T>) {
  const timezoneField = fieldPath<T>("timezone");
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Controller
        name={timezoneField}
        control={control}
        render={({ field }) => (
          <TimezoneSelect
            value={field.value ? toIanaTimezone(field.value) : null}
            onChangeAction={value => {
              field.onChange(value ?? "");
            }}
            onBlurAction={field.onBlur}
            label={labels.fields.timezone}
            required
            error={!!errors.timezone}
            helperText={validationMessage(labels, getErrorMessage(errors.timezone))}
            fullWidth
          />
        )}
      />
    </Grid>
  );
}

interface CurrencyFieldProps<T extends OnboardingFields> {
  readonly control: Control<T>;
  readonly labels: UserEntityOnboardingLabels;
}

export function CurrencyField<T extends OnboardingFields>({ control, labels }: CurrencyFieldProps<T>) {
  const displayCurrencyField = fieldPath<T>("displayCurrency");
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <CurrencyControllerField
        control={control}
        name={displayCurrencyField}
        label={labels.fields.displayCurrency}
        formatError={message => validationMessage(labels, message)}
      />
    </Grid>
  );
}

/**
 * Dedicated password field for onboarding forms (parent/student/teacher/manager).
 *
 * Masks the input with `type="password"` (toggleable to "text" via show/hide),
 * adds a Visibility/VisibilityOff IconButton to reveal/hide the value, and
 * renders a `PasswordStrengthMeter` below the field (reuses the unified
 * `countPasswordClasses` + `PASSWORD_MIN_LENGTH` helper so the meter stays
 * aligned with the Zod schema's notion of strength).
 */
export function OnboardingPasswordField<T extends OnboardingFields>({
  control,
  errors,
  labels,
}: FieldComponentProps<T>) {
  const [showPassword, setShowPassword] = useState(false);
  const passwordField = fieldPath<T>("password");
  const passwordValue = (useWatch({ control, name: passwordField }) as string | undefined) ?? "";

  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Controller
        name={passwordField}
        control={control}
        render={({ field }) => (
          <Box>
            <TextField
              {...field}
              label={labels.fields.password}
              placeholder={labels.placeholders.password}
              required
              type={showPassword ? "text" : "password"}
              error={!!errors.password}
              helperText={validationMessage(labels, getErrorMessage(errors.password))}
              fullWidth
              sx={outlinedInputSx}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={showPassword ? labels.validation.hidePassword : labels.validation.showPassword}>
                        <IconButton
                          onClick={() => {
                            setShowPassword(!showPassword);
                          }}
                          edge="end"
                          aria-label={showPassword ? labels.validation.hidePassword : labels.validation.showPassword}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <PasswordStrengthMeter
              password={passwordValue}
              labels={{
                strength: labels.validation.passwordStrength,
                weak: labels.validation.strengthWeak,
                fair: labels.validation.strengthFair,
                strong: labels.validation.strengthStrong,
              }}
            />
          </Box>
        )}
      />
    </Grid>
  );
}
