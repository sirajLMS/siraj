"use client";

import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, Grid, IconButton, InputAdornment, TextField } from "@mui/material";
import { useState } from "react";
import {
  type Control,
  Controller,
  type FieldErrors,
  type FieldValues,
  type Path,
  type UseFormRegister,
  useWatch,
} from "react-hook-form";
import { PasswordStrengthMeter } from "@/frontend/common/components/auth/__shared__/PasswordStrengthMeter";
import type { UserEntityOnboardingFieldsShape } from "@/frontend/common/components/onboarding/sections/types";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";
import { PhoneFormField } from "@/frontend/common/components/ui/input";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import { TimezoneSelect } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import { toIanaTimezone } from "@/frontend/common/lib/timezone";
import { CurrencyControllerField } from "@/frontend/common/views/dashboard/profile/shared/CurrencyControllerField";
import type { UserEntityOnboardingLabels } from "@/shared/locale/types/onboarding/userEntity";

type OnboardingFields = UserEntityOnboardingFieldsShape & FieldValues;

type ValidationLabels = UserEntityOnboardingLabels["validation"];

function isValidationKey(key: string, validation: ValidationLabels): key is keyof typeof validation {
  return key in validation;
}

function validationMessage(
  labels: UserEntityOnboardingLabels,
  message: string | { message?: string } | undefined
): string | undefined {
  if (!message) return undefined;
  const msgStr = typeof message === "string" ? message : message.message;
  if (!msgStr) return undefined;
  if (isValidationKey(msgStr, labels.validation)) {
    return labels.validation[msgStr];
  }
  return msgStr;
}

function getErrorMessage(error: unknown): string | undefined {
  if (error && typeof error === "object" && "message" in error) {
    const msg = error.message;
    return typeof msg === "string" ? msg : undefined;
  }
  return undefined;
}

function isFieldPath<T extends OnboardingFields>(value: string): value is Path<T> {
  return typeof value === "string";
}

function fieldPath<T extends OnboardingFields>(value: string): Path<T> {
  if (!isFieldPath<T>(value)) {
    throw new Error(`Invalid field path: ${value}`);
  }
  return value;
}

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

interface AvatarFieldProps<T extends OnboardingFields> {
  readonly control: Control<T>;
  readonly labels: UserEntityOnboardingLabels;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
}

function AvatarField<T extends OnboardingFields>({ control, labels, onUploadAvatar }: AvatarFieldProps<T>) {
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

interface SimpleTextFieldProps<T extends OnboardingFields> {
  readonly control: Control<T>;
  readonly errors: FieldErrors<T>;
  readonly labels: UserEntityOnboardingLabels;
  readonly fieldName: string;
  readonly labelKey: keyof UserEntityOnboardingLabels["fields"];
  readonly placeholderKey: keyof UserEntityOnboardingLabels["placeholders"];
  readonly errorKey: keyof T;
  readonly type?: string;
}

function SimpleTextField<T extends OnboardingFields>(props: SimpleTextFieldProps<T>) {
  return <TextFieldWrapper {...props} fieldName={fieldPath<T>(props.fieldName)} />;
}

function createTextFieldComponent(
  fieldName: string,
  labelKey: keyof UserEntityOnboardingLabels["fields"],
  placeholderKey: keyof UserEntityOnboardingLabels["placeholders"],
  errorKey: string,
  type = "text"
) {
  return function TextFieldComponent<T extends OnboardingFields>({
    control,
    errors,
    labels,
  }: {
    readonly control: Control<T>;
    readonly errors: FieldErrors<T>;
    readonly labels: UserEntityOnboardingLabels;
  }) {
    return (
      <SimpleTextField
        control={control}
        errors={errors}
        labels={labels}
        fieldName={fieldName}
        labelKey={labelKey}
        placeholderKey={placeholderKey}
        errorKey={errorKey}
        type={type}
      />
    );
  };
}

const NameField = createTextFieldComponent("name", "fullName", "fullName", "name");
const EmailField = createTextFieldComponent("email", "email", "email", "email", "email");
// PasswordField is a DEDICATED component (not created via createTextFieldComponent)
// because it needs: type="password" (masking — the generic factory defaulted to
// "text" which rendered passwords in plaintext), a show/hide toggle, and a live
// PasswordStrengthMeter below the field. Defined after the generic helpers.

interface PhoneFieldProps<T extends OnboardingFields> {
  readonly control: Control<T>;
  readonly errors: FieldErrors<T>;
  readonly labels: UserEntityOnboardingLabels;
  readonly phoneRequired?: boolean;
}

function PhoneField<T extends OnboardingFields>({ control, errors, labels, phoneRequired }: PhoneFieldProps<T>) {
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

function TimezoneField<T extends OnboardingFields>({ control, errors, labels }: TimezoneFieldProps<T>) {
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

function CurrencyField<T extends OnboardingFields>({ control, labels }: CurrencyFieldProps<T>) {
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
 * Fixes a prior bug where the generic `createTextFieldComponent` factory was
 * used without passing `type="password"`, so the default `"text"` type rendered
 * the password in PLAINTEXT. This component:
 *   - masks the input with `type="password"` (toggleable to "text" via show/hide);
 *   - adds a Visibility/VisibilityOff IconButton to reveal/hide the value;
 *   - renders a `PasswordStrengthMeter` below the field (reuses the unified
 *     `countPasswordClasses` + `PASSWORD_MIN_LENGTH` helper so the meter stays
 *     aligned with the Zod schema's notion of strength).
 */
function OnboardingPasswordField<T extends OnboardingFields>({
  control,
  errors,
  labels,
}: {
  readonly control: Control<T>;
  readonly errors: FieldErrors<T>;
  readonly labels: UserEntityOnboardingLabels;
}) {
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
                      <IconButton
                        onClick={() => {
                          setShowPassword(!showPassword);
                        }}
                        edge="end"
                        aria-label={showPassword ? labels.validation.hidePassword : labels.validation.showPassword}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
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

export interface UserEntityFieldsSectionProps<T extends OnboardingFields> {
  readonly register: UseFormRegister<T>;
  readonly control: Control<T>;
  readonly errors: FieldErrors<T>;
  readonly labels: UserEntityOnboardingLabels;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
  readonly phoneRequired?: boolean;
}

export function UserEntityFieldsSection<T extends OnboardingFields>({
  control,
  errors,
  labels,
  onUploadAvatar,
  phoneRequired = false,
}: Readonly<Omit<UserEntityFieldsSectionProps<T>, "register">>) {
  return (
    <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
      <AvatarField control={control} labels={labels} onUploadAvatar={onUploadAvatar} />
      <NameField control={control} errors={errors} labels={labels} />
      <EmailField control={control} errors={errors} labels={labels} />
      <OnboardingPasswordField control={control} errors={errors} labels={labels} />
      <PhoneField control={control} errors={errors} labels={labels} phoneRequired={phoneRequired} />
      <TimezoneField control={control} errors={errors} labels={labels} />
      <CurrencyField control={control} labels={labels} />
    </Grid>
  );
}
