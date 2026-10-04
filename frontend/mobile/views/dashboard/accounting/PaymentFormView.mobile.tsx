"use client";

import { Box, CircularProgress } from "@mui/material";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import type { UsePaymentFormViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentFormViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { PaymentCreateFormMobile } from "@/frontend/mobile/views/dashboard/accounting/PaymentFormView.mobile.createForm";
import { PaymentEditFormMobile } from "@/frontend/mobile/views/dashboard/accounting/PaymentFormView.mobile.parts";

export function PaymentFormMobile(props: Readonly<UsePaymentFormViewModel>) {
  const { t, isEditing, loadingExisting, showSuccess, onDismissSuccess } = props;

  if (isEditing && loadingExisting) {
    return (
      <MobilePageContainer>
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress size={32} />
        </Box>
      </MobilePageContainer>
    );
  }

  const title = isEditing ? t.editPayment : t.addPayment;

  return (
    <MobilePageContainer>
      <MobilePageHeader title={title} subtitle={isEditing ? t.editFormSubtitle : t.formSubtitle} />

      {isEditing ? <PaymentEditFormMobile {...props} /> : <PaymentCreateFormMobile {...props} />}

      <FormSuccessSnackbar open={showSuccess} message={t.saveSuccess} onClose={onDismissSuccess} />
    </MobilePageContainer>
  );
}
