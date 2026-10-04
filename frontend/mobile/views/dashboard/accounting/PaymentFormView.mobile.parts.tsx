"use client";

import { SaveOutlined, SyncOutlined } from "@mui/icons-material";
import { TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import { Controller } from "react-hook-form";
import { PaymentDecimalControllerField } from "@/frontend/common/views/dashboard/accounting/components/__shared__/paymentFormFieldsShared";
import { paymentReadOnlyFieldSx } from "@/frontend/common/views/dashboard/accounting/components/__shared__/paymentFormFieldsShared.styles";
import {
  GatewaySelectField,
  PaymentNoteField,
} from "@/frontend/common/views/dashboard/accounting/components/PaymentFormFields";
import type { UsePaymentFormViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentFormViewModel";
import { MobileContentInset, MobileContentStack, MobilePrimaryPageAction } from "@/frontend/mobile/components/ui";

type PaymentFormSubmitButtonsProps = {
  readonly isSubmitting: boolean;
  readonly submitLabel: string;
  readonly savingLabel: string;
  readonly cancelLabel: string;
};

export function PaymentFormSubmitButtonsMobile({
  isSubmitting,
  submitLabel,
  savingLabel,
  cancelLabel,
}: PaymentFormSubmitButtonsProps) {
  const router = useRouter();

  return (
    <>
      <MobilePrimaryPageAction
        type="submit"
        disabled={isSubmitting}
        startIcon={isSubmitting ? <SyncOutlined /> : <SaveOutlined />}
      >
        {isSubmitting ? savingLabel : submitLabel}
      </MobilePrimaryPageAction>
      <MobilePrimaryPageAction
        variant="text"
        color="inherit"
        onClick={() => router.push("/accounting/payments")}
        disabled={isSubmitting}
      >
        {cancelLabel}
      </MobilePrimaryPageAction>
    </>
  );
}

export function PaymentEditFormMobile(props: Readonly<UsePaymentFormViewModel>) {
  const { t, editControl, handleEditSubmit, isSubmitting, onEditSubmit, existing } = props;
  const gatewayFieldArgs = { label: t.form.paymentGateway, localizedGateways: t.gateways };

  return (
    <form onSubmit={handleEditSubmit(onEditSubmit)} noValidate>
      <MobileContentInset>
        <MobileContentStack gap={2.5} paddingBottom={6}>
          <TextField
            size="small"
            label={t.form.student}
            value={existing?.studentName ?? "—"}
            disabled
            sx={paymentReadOnlyFieldSx}
          />
          <TextField
            size="small"
            label={`${t.columns.paid} / ${t.form.currency}`}
            value={existing ? `${Number(existing.amount ?? 0).toFixed(2)} ${existing.currency ?? ""}` : "—"}
            disabled
            sx={paymentReadOnlyFieldSx}
          />

          <PaymentDecimalControllerField
            control={editControl}
            name="creditHours"
            label={t.form.credit}
            inputStep={0.5}
            inputMin={0.5}
          />

          <Controller
            name="paymentNote"
            control={editControl}
            render={({ field }) => (
              <PaymentNoteField
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                label={t.form.note}
                placeholder={t.form.notePlaceholder}
              />
            )}
          />

          <Controller
            name="paymentGateway"
            control={editControl}
            render={({ field }) => (
              <GatewaySelectField value={field.value} onChange={field.onChange} {...gatewayFieldArgs} />
            )}
          />

          <PaymentFormSubmitButtonsMobile
            isSubmitting={isSubmitting}
            submitLabel={t.form.submit}
            savingLabel={t.form.saving}
            cancelLabel={t.form.cancel}
          />
        </MobileContentStack>
      </MobileContentInset>
    </form>
  );
}
