"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useTeacherOnboardingStore } from "@/frontend/stores/mockTeacherOnboardingStore";
import { logger } from "@/frontend/utils/logger";
import type { MessageSchema } from "@/shared/messages/types/message";
import type { TeacherOnboardingFormData } from "./schemas/teacherOnboardingSchema";
import { TeacherOnboardingView } from "./TeacherOnboardingView";

export function TeacherOnboardingContainer() {
  const t = useTranslations("dashboard.teacherOnboarding");
  const { isSubmitting, setSubmitting, reset } = useTeacherOnboardingStore();
  const [showSuccess, setShowSuccess] = useState(false);

  // Map translations to the structure expected by the view
  const labels: MessageSchema["dashboard"]["teacherOnboarding"] = {
    pageTitle: t("pageTitle"),
    pageSubtitle: t("pageSubtitle"),
    mandatoryFields: t("mandatoryFields"),
    sections: {
      teacherInfo: t("sections.teacherInfo"),
      officialDetails: t("sections.officialDetails"),
      salaryDetails: t("sections.salaryDetails"),
      bankingLedger: t("sections.bankingLedger"),
    },
    fields: {
      fullName: t("fields.fullName"),
      email: t("fields.email"),
      nationality: t("fields.nationality"),
      nationalId: t("fields.nationalId"),
      phone: t("fields.phone"),
      age: t("fields.age"),
      gender: t("fields.gender"),
      male: t("fields.male"),
      female: t("fields.female"),
      address: t("fields.address"),
      qualifications: t("fields.qualifications"),
      skypeId: t("fields.skypeId"),
      zoomLink: t("fields.zoomLink"),
      country: t("fields.country"),
      zoomUsername: t("fields.zoomUsername"),
      zoomPassword: t("fields.zoomPassword"),
      timezone: t("fields.timezone"),
      salaryAmount: t("fields.salaryAmount"),
      currency: t("fields.currency"),
      beneficiaryName: t("fields.beneficiaryName"),
      bankName: t("fields.bankName"),
      accountNumber: t("fields.accountNumber"),
      routingNumber: t("fields.routingNumber"),
      swiftBic: t("fields.swiftBic"),
      iban: t("fields.iban"),
    },
    placeholders: {
      fullName: t("placeholders.fullName"),
      email: t("placeholders.email"),
      nationality: t("placeholders.nationality"),
      nationalId: t("placeholders.nationalId"),
      phone: t("placeholders.phone"),
      age: t("placeholders.age"),
      address: t("placeholders.address"),
      qualifications: t("placeholders.qualifications"),
      skypeId: t("placeholders.skypeId"),
      zoomLink: t("placeholders.zoomLink"),
      zoomUsername: t("placeholders.zoomUsername"),
      zoomPassword: t("placeholders.zoomPassword"),
      salaryAmount: t("placeholders.salaryAmount"),
      beneficiaryName: t("placeholders.beneficiaryName"),
      bankName: t("placeholders.bankName"),
      accountNumber: t("placeholders.accountNumber"),
      routingNumber: t("placeholders.routingNumber"),
      swiftBic: t("placeholders.swiftBic"),
      iban: t("placeholders.iban"),
    },
    actions: {
      signup: t("actions.signup"),
      cancel: t("actions.cancel"),
      proceeding: t("actions.proceeding"),
      successMessage: t("actions.successMessage"),
    },
    validation: {
      fullNameRequired: t("validation.fullNameRequired"),
      emailRequired: t("validation.emailRequired"),
      emailInvalid: t("validation.emailInvalid"),
      nationalIdRequired: t("validation.nationalIdRequired"),
      phoneRequired: t("validation.phoneRequired"),
      genderRequired: t("validation.genderRequired"),
      countryRequired: t("validation.countryRequired"),
      timezoneRequired: t("validation.timezoneRequired"),
      salaryAmountRequired: t("validation.salaryAmountRequired"),
      currencyRequired: t("validation.currencyRequired"),
      beneficiaryNameRequired: t("validation.beneficiaryNameRequired"),
      bankNameRequired: t("validation.bankNameRequired"),
      accountNumberRequired: t("validation.accountNumberRequired"),
      ibanRequired: t("validation.ibanRequired"),
      urlInvalid: t("validation.urlInvalid"),
    },
  };

  const handleSubmit = async (data: TeacherOnboardingFormData) => {
    setSubmitting(true);
    logger.info("Submitting teacher onboarding data:", data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSubmitting(false);
    setShowSuccess(true);
    reset();
  };

  const handleDismissSuccess = () => {
    setShowSuccess(false);
  };

  return (
    <TeacherOnboardingView
      isSubmitting={isSubmitting}
      showSuccess={showSuccess}
      labels={labels}
      onSubmit={handleSubmit}
      onDismissSuccess={handleDismissSuccess}
    />
  );
}
