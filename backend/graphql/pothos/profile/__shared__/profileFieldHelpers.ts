import type { PothosInputFieldBuilder } from "@/backend/graphql/pothos/shared/builder-types";
import { NationalIdInputPothosObject } from "@/backend/graphql/pothos/shared/national-id.pothos";

const MAX_LENGTH = {
  PHONE: 50,
  NATIONALITY: 100,
  ADDRESS: 500,
  SOCIAL: 255,
  NATIONAL_ID: 255,
  COUNTRY_CODE: 10,
  DATE_OF_BIRTH: 20,
  QUALIFICATIONS: 2000,
  INVOICE_TYPE: 50,
  FEE_AMOUNT: 50,
} as const;

function constrainedString(fieldBuilder: PothosInputFieldBuilder, maxLength: number) {
  return fieldBuilder.string({ required: false, directives: { constraint: { maxLength } } });
}

/**
 * Fields shared across TeacherOwn and ParentAdmin profile update inputs.
 */
export function profileContactInputFields(t: PothosInputFieldBuilder) {
  return {
    phone: constrainedString(t, MAX_LENGTH.PHONE),
    nationality: constrainedString(t, MAX_LENGTH.NATIONALITY),
    address: constrainedString(t, MAX_LENGTH.ADDRESS),
    timezone: t.field({ type: "IanaTimezone", required: false }),
  };
}

/**
 * Social media fields shared across ParentOwn and ParentAdmin profile update inputs.
 */
export function profileSocialInputFields(t: PothosInputFieldBuilder) {
  return {
    facebook: constrainedString(t, MAX_LENGTH.SOCIAL),
    whatsapp: constrainedString(t, MAX_LENGTH.PHONE),
    twitter: constrainedString(t, MAX_LENGTH.PHONE),
  };
}

/**
 * Teacher-specific profile update fields (non-shared portion).
 */
export function teacherSpecificInputFields(t: PothosInputFieldBuilder) {
  return {
    countryCode: constrainedString(t, MAX_LENGTH.COUNTRY_CODE),
    nationalId: t.field({ type: NationalIdInputPothosObject, required: false }),
    dateOfBirth: constrainedString(t, MAX_LENGTH.DATE_OF_BIRTH),
    qualifications: constrainedString(t, MAX_LENGTH.QUALIFICATIONS),
  };
}

/**
 * Parent-admin-only billing fields.
 */
export function parentAdminBillingInputFields(t: PothosInputFieldBuilder) {
  return {
    invoiceType: constrainedString(t, MAX_LENGTH.INVOICE_TYPE),
    feeAmount: constrainedString(t, MAX_LENGTH.FEE_AMOUNT),
  };
}
