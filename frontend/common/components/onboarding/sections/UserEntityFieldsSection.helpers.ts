import type { FieldValues, Path } from "react-hook-form";
import type { UserEntityOnboardingFieldsShape } from "@/frontend/common/components/onboarding/sections/types";
import type { UserEntityOnboardingLabels } from "@/shared/locale/types/onboarding/userEntity";

/**
 * Validation and field-path helpers for the shared onboarding entity form.
 * These are plain functions (no JSX) so the field component module can stay
 * component-only for Fast Refresh.
 */

export type OnboardingFields = UserEntityOnboardingFieldsShape & FieldValues;

type ValidationLabels = UserEntityOnboardingLabels["validation"];

function isValidationKey(key: string, validation: ValidationLabels): key is keyof typeof validation {
  return key in validation;
}

export function validationMessage(
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

export function getErrorMessage(error: unknown): string | undefined {
  if (error && typeof error === "object" && "message" in error) {
    const msg = error.message;
    return typeof msg === "string" ? msg : undefined;
  }
  return undefined;
}

function isFieldPath<T extends OnboardingFields>(value: string): value is Path<T> {
  return typeof value === "string";
}

export function fieldPath<T extends OnboardingFields>(value: string): Path<T> {
  if (!isFieldPath<T>(value)) {
    throw new Error(`Invalid field path: ${value}`);
  }
  return value;
}
