"use client";

import { Stack } from "@mui/material";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import type { UsePaymentFormViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentFormViewModel";
import { DesktopFormErrorSnackbar } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import {
  PaymentFormActions,
  PaymentFormLoadingState,
} from "@/frontend/desktop/views/dashboard/accounting/PaymentFormView.desktop.parts";
import {
  PaymentCreateDetailsSection,
  PaymentEditFieldsSection,
} from "@/frontend/desktop/views/dashboard/accounting/PaymentFormView.desktop.sections";
import { PaymentCreateStudentPackageSection } from "@/frontend/desktop/views/dashboard/accounting/PaymentFormView.desktop.studentPackage";

export function PaymentFormDesktop(props: Readonly<UsePaymentFormViewModel>) {
  const {
    t,
    control,
    editControl,
    errors,
    handleSubmit,
    handleEditSubmit,
    isSubmitting,
    isEditing,
    loadingExisting,
    showSuccess,
    submitError,
    existing,
    lastPaymentCurrency,
    currencyMismatch,
    onSubmit,
    onEditSubmit,
    onDismissSuccess,
    onDismissError,
  } = props;

  if (isEditing && loadingExisting) {
    return <PaymentFormLoadingState />;
  }

  const title = isEditing ? t.editPayment : t.addPayment;

  const formActions = (
    <PaymentFormActions
      isSubmitting={isSubmitting}
      submitLabel={t.form.submit}
      savingLabel={t.form.saving}
      cancelLabel={t.form.cancel}
    />
  );

  const breadcrumbs = [
    { label: t.pageTitle, href: "/accounting/payments" },
    { label: title, current: true },
  ];

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={title}
        subtitle={isEditing ? t.editFormSubtitle : t.formSubtitle}
        breadcrumbs={breadcrumbs}
      />

      {isEditing ? (
        <form
          onSubmit={handleEditSubmit(onEditSubmit)}
          noValidate
          style={{ maxWidth: 1100, width: "100%", marginInline: "auto" }}
        >
          <Stack spacing={3}>
            <PaymentEditFieldsSection t={t} editControl={editControl} existing={existing} />
            {formActions}
          </Stack>
        </form>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          style={{ maxWidth: 1100, width: "100%", marginInline: "auto" }}
        >
          <Stack spacing={3}>
            <PaymentCreateStudentPackageSection
              t={t}
              control={control}
              errors={errors}
              currencyMismatch={currencyMismatch}
              lastPaymentCurrency={lastPaymentCurrency}
            />
            <PaymentCreateDetailsSection t={t} control={control} />
            {formActions}
          </Stack>
        </form>
      )}

      <FormSuccessSnackbar open={showSuccess} message={t.saveSuccess} onClose={onDismissSuccess} />
      <DesktopFormErrorSnackbar open={Boolean(submitError)} message={submitError ?? ""} onClose={onDismissError} />
    </DesktopPageContainer>
  );
}
