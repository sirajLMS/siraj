"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAdminManualInvoiceStore } from "@/frontend/stores/mocKAdminManualInvoiceStore";
import { useUserStore } from "@/frontend/stores/mockUserStore";
import { ManualInvoiceView } from "./ManualInvoiceView";
import { buildManualInvoiceLabels } from "./utils/buildManualInvoiceLabels";

export function ManualInvoiceContainer() {
  const t = useTranslations("dashboard.billing.manual");
  const router = useRouter();
  const locale = useLocale();
  const permissions = useUserStore(state => state.permissions);

  const parentOptions = useAdminManualInvoiceStore(state => state.parentOptions);
  const isSubmitting = useAdminManualInvoiceStore(state => state.isSubmitting);
  const showSuccess = useAdminManualInvoiceStore(state => state.showSuccess);
  const setSubmitting = useAdminManualInvoiceStore(state => state.setSubmitting);
  const setShowSuccess = useAdminManualInvoiceStore(state => state.setShowSuccess);
  const resetSuccess = useAdminManualInvoiceStore(state => state.resetSuccess);
  const submitInvoice = useAdminManualInvoiceStore(state => state.submitInvoice);

  const canCreate = permissions.includes("billing-create");
  const canSendEmail = permissions.includes("billing-manage");

  const handleBack = () => {
    router.push(`/${locale}/billing`);
  };

  const handleSubmit = (data: Parameters<typeof submitInvoice>[0], sendEmail: boolean) => {
    setSubmitting(true);
    resetSuccess();
    submitInvoice(data, sendEmail);
    setShowSuccess(true);
    setSubmitting(false);
  };

  if (!canCreate) {
    return null;
  }

  const labels = buildManualInvoiceLabels(t);

  return (
    <ManualInvoiceView
      labels={labels}
      parentOptions={parentOptions}
      isSubmitting={isSubmitting}
      showSuccess={showSuccess}
      canCreate={canCreate}
      canSendEmail={canSendEmail}
      onBack={handleBack}
      onSubmit={handleSubmit}
      onDismissSuccess={resetSuccess}
    />
  );
}
