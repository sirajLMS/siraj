"use client";

import type { Control, FieldErrors, FieldValues, UseFormRegister } from "react-hook-form";
import type { CurrencyCode, Gender } from "@/frontend/common/graphql/generated/gql/graphql";

/**
 * Canonical user-entity fields collected at onboarding (users table columns).
 */
export interface UserEntityOnboardingFieldsShape {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly avatarUrl?: string | null;
  readonly phone?: string | null;
  readonly timezone: string;
  readonly displayCurrency?: CurrencyCode | null;
}

/**
 * Identity fields: name, email, password, avatar
 * Shared across all onboarding flows (Teacher, Parent, Student, Manager)
 */
export interface UserIdentityFieldsShape {
  readonly name?: string;
  readonly fullName?: string;
  readonly email: string;
  readonly password: string;
  readonly avatarUrl?: string | null;
  readonly phone?: string | null;
}

/**
 * Contact fields: phone
 * Used by Teacher, Parent, Manager (Student has phone on extension row)
 */
export interface UserContactFieldsShape {
  readonly phone?: string | null;
}

/**
 * Personal fields: nationality, address, dateOfBirth, gender
 * Used by Teacher, Parent (Student has some on extension)
 */
export interface UserPersonalFieldsShape {
  readonly nationality?: string;
  readonly address?: string;
  readonly dateOfBirth?: string;
  readonly gender?: Gender | null;
  readonly qualifications?: string;
}

/**
 * Full shape for the shared onboarding fields section
 */
export interface UserOnboardingCoreFieldsShape
  extends UserIdentityFieldsShape,
    UserContactFieldsShape,
    UserPersonalFieldsShape {
  // Extension point for type-specific fields
}

/**
 * Translation keys needed by shared sections.
 * Identity keys are required; personal/contact keys are optional per flow.
 */
export interface OnboardingSectionTranslations {
  readonly fields: {
    readonly fullName: string;
    readonly email: string;
    readonly password: string;
    readonly phone: string;
    readonly avatar: string;
    readonly nationality?: string;
    readonly address?: string;
    readonly dateOfBirth?: string;
    readonly gender?: string;
    readonly male?: string;
    readonly female?: string;
    readonly qualifications?: string;
    [key: string]: string | undefined;
  };
  readonly placeholders: {
    readonly fullName: string;
    readonly email: string;
    readonly password: string;
    readonly phone: string;
    readonly nationality?: string;
    readonly address?: string;
    readonly dateOfBirth?: string;
    readonly qualifications?: string;
    [key: string]: string | undefined;
  };
  readonly validation: Record<string, string>;
}

/**
 * Props for the UserIdentityFields component
 */
export interface UserIdentityFieldsProps<T extends UserIdentityFieldsShape & FieldValues> {
  readonly register: UseFormRegister<T>;
  readonly control: Control<T>;
  readonly errors: FieldErrors<T>;
  readonly translate: OnboardingSectionTranslations;
  readonly phoneRequired?: boolean;
  readonly hidePhone?: boolean;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
}

/**
 * Props for the UserContactFields component
 */
export interface UserContactFieldsProps<T extends UserContactFieldsShape & FieldValues> {
  readonly control: Control<T>;
  readonly errors: FieldErrors<T>;
  readonly translate: OnboardingSectionTranslations;
  readonly phoneRequired?: boolean;
}

/**
 * Props for the UserPersonalFields component
 */
export interface UserPersonalFieldsProps<T extends UserPersonalFieldsShape & FieldValues> {
  readonly register: UseFormRegister<T>;
  readonly control: Control<T>;
  readonly errors: FieldErrors<T>;
  readonly translate: OnboardingSectionTranslations;
  readonly hideQualifications?: boolean;
}
