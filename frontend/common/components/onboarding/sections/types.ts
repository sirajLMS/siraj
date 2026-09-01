"use client";

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
