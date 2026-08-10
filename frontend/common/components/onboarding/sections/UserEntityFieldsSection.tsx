"use client";

import { Grid, TextField } from "@mui/material";
import type { Control, FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { UserEntityOnboardingFieldsShape } from "@/frontend/common/components/onboarding/sections/types";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import { PhoneFormField } from "@/frontend/common/components/ui/input";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { TimezoneSelect } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
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
const PasswordField = createTextFieldComponent("password", "password", "password", "password");

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
            value={field.value ? toGraphqlIanaTimezone(field.value) : null}
            onChangeAction={value => {
              field.onChange(value ? fromGraphqlIanaTimezone(value) : "");
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
      <Controller
        name={displayCurrencyField}
        control={control}
        render={({ field, fieldState }) => {
          const option: CurrencyOption | null = field.value ? (getCurrencyByCode(field.value) ?? null) : null;
          return (
            <CurrencySelect
              currency={option}
              setCurrencyAction={selected => {
                field.onChange(selected.code);
              }}
              onBlurAction={field.onBlur}
              label={labels.fields.displayCurrency}
              error={Boolean(fieldState.error)}
              helperText={validationMessage(labels, fieldState.error?.message)}
              fullWidth
            />
          );
        }}
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
      <PasswordField control={control} errors={errors} labels={labels} />
      <PhoneField control={control} errors={errors} labels={labels} phoneRequired={phoneRequired} />
      <TimezoneField control={control} errors={errors} labels={labels} />
      <CurrencyField control={control} labels={labels} />
    </Grid>
  );
}
