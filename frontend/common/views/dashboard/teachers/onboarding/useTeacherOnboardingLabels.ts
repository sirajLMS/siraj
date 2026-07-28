import type { TeacherOnboardingLabels } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale";

type TeacherOnboardingTranslations = ReturnType<typeof useAppTranslation>["dashboardTranslations"]["teacherOnboarding"];

function buildSections(t: TeacherOnboardingTranslations): TeacherOnboardingLabels["sections"] {
  return {
    teacherInfo: t.sections.teacherInfo,
    officialDetails: t.sections.officialDetails,
    salaryDetails: t.sections.salaryDetails,
    paymentMethod: t.sections.paymentMethod,
    addPaymentMethod: t.sections.addPaymentMethod,
    meetingConfig: t.sections.meetingConfig,
  };
}

function buildFields(t: TeacherOnboardingTranslations): TeacherOnboardingLabels["fields"] {
  return {
    fullName: t.fields.fullName,
    email: t.fields.email,
    password: t.fields.password,
    nationality: t.fields.nationality,
    nationalId: t.fields.nationalId,
    phone: t.fields.phone,
    dateOfBirth: t.fields.dateOfBirth,
    gender: t.fields.gender,
    male: t.fields.male,
    female: t.fields.female,
    address: t.fields.address,
    qualifications: t.fields.qualifications,
    country: t.fields.country,
    timezone: t.fields.timezone,
    salaryAmount: t.fields.salaryAmount,
    currency: t.fields.currency,
    meetingProvider: t.fields.meetingProvider,
    meetingUrl: t.fields.meetingUrl,
    meetingLabel: t.fields.meetingLabel,
    avatar: t.fields.avatar,
  };
}

function buildPlaceholders(t: TeacherOnboardingTranslations): TeacherOnboardingLabels["placeholders"] {
  return {
    fullName: t.placeholders.fullName,
    email: t.placeholders.email,
    password: t.placeholders.password,
    nationality: t.placeholders.nationality,
    nationalId: t.placeholders.nationalId,
    phone: t.placeholders.phone,
    dateOfBirth: t.placeholders.dateOfBirth,
    address: t.placeholders.address,
    qualifications: t.placeholders.qualifications,
    salaryAmount: t.placeholders.salaryAmount,
    meetingUrl: t.placeholders.meetingUrl,
    meetingLabel: t.placeholders.meetingLabel,
  };
}

function buildActions(t: TeacherOnboardingTranslations): TeacherOnboardingLabels["actions"] {
  return {
    signup: t.actions.signup,
    cancel: t.actions.cancel,
    proceeding: t.actions.proceeding,
    successMessage: t.actions.successMessage,
  };
}

function buildValidation(t: TeacherOnboardingTranslations): TeacherOnboardingLabels["validation"] {
  return {
    fullNameRequired: t.validation.fullNameRequired,
    emailRequired: t.validation.emailRequired,
    emailInvalid: t.validation.emailInvalid,
    passwordRequired: t.validation.passwordRequired,
    nationalIdRequired: t.validation.nationalIdRequired,
    phoneRequired: t.validation.phoneRequired,
    genderRequired: t.validation.genderRequired,
    countryRequired: t.validation.countryRequired,
    timezoneRequired: t.validation.timezoneRequired,
    salaryAmountRequired: t.validation.salaryAmountRequired,
    currencyRequired: t.validation.currencyRequired,
    urlInvalid: t.validation.urlInvalid,
  };
}

export function useTeacherOnboardingLabels(): TeacherOnboardingLabels {
  const t = useAppTranslation().dashboardTranslations.teacherOnboarding;
  return {
    pageTitle: t.pageTitle,
    pageSubtitle: t.pageSubtitle,
    mandatoryFields: t.mandatoryFields,
    sections: buildSections(t),
    fields: buildFields(t),
    placeholders: buildPlaceholders(t),
    actions: buildActions(t),
    validation: buildValidation(t),
    optionalHint: t.optionalHint,
  };
}
