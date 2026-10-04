"use client";

import { Stack, TextField } from "@mui/material";
import { Controller } from "react-hook-form";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  PaymentDecimalControllerField,
  PaymentPaidStatusControllerField,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/paymentFormFieldsShared";
import { paymentReadOnlyFieldSx } from "@/frontend/common/views/dashboard/accounting/components/__shared__/paymentFormFieldsShared.styles";
import { GatewaySelectField } from "@/frontend/common/views/dashboard/accounting/components/PaymentFormFields";
import type { UsePaymentFormViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentFormViewModel";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopAppDatePicker } from "@/frontend/desktop/components/ui/form/date";
import { PaymentNoteControllerField } from "@/frontend/desktop/views/dashboard/accounting/PaymentFormView.desktop.parts";

type EditFieldsSectionProps = Pick<UsePaymentFormViewModel, "t" | "editControl" | "existing">;

/** Edit mode: only hours / gateway / note stay mutable (invoice snapshot locked). */
export function PaymentEditFieldsSection({ t, editControl, existing }: Readonly<EditFieldsSectionProps>) {
  const gatewayFieldArgs = { label: t.form.paymentGateway, localizedGateways: t.gateways };
  return (
    <DesktopSectionPanel title={t.paymentDetails}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 2 }}>
          <TextField
            size="small"
            label={t.form.student}
            value={existing?.studentName ?? "—"}
            disabled
            sx={theme => ({ ...paymentReadOnlyFieldSx(theme), flex: 1, minWidth: 220 })}
          />
          <TextField
            size="small"
            label={`${t.columns.paid} / ${t.form.currency}`}
            value={existing ? `${formatAccountingMoney(existing.amount)} ${existing.currency ?? ""}` : "—"}
            disabled
            sx={theme => ({ ...paymentReadOnlyFieldSx(theme), flex: 1, minWidth: 170 })}
          />
        </Stack>

        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 2 }}>
          <PaymentDecimalControllerField
            control={editControl}
            name="creditHours"
            label={t.form.credit}
            inputStep={0.5}
            inputMin={0.5}
            sx={{ flex: 1, minWidth: 220 }}
          />
          <Controller
            name="paymentGateway"
            control={editControl}
            render={({ field }) => (
              <GatewaySelectField
                value={field.value}
                onChange={field.onChange}
                {...gatewayFieldArgs}
                sx={{ flex: 1, minWidth: 240 }}
              />
            )}
          />
        </Stack>

        <PaymentNoteControllerField
          control={editControl}
          name="paymentNote"
          label={t.form.note}
          placeholder={t.form.notePlaceholder}
        />
      </Stack>
    </DesktopSectionPanel>
  );
}

type CreateDetailsSectionProps = Pick<UsePaymentFormViewModel, "t" | "control">;

/** Create mode: gateway, payment date, paid toggle, and note. */
export function PaymentCreateDetailsSection({ t, control }: Readonly<CreateDetailsSectionProps>) {
  const gatewayFieldArgs = { label: t.form.paymentGateway, localizedGateways: t.gateways };
  return (
    <DesktopSectionPanel title={t.paymentDetails}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 2, alignItems: "center" }}>
          <Controller
            name="paymentGateway"
            control={control}
            render={({ field }) => (
              <GatewaySelectField
                value={field.value}
                onChange={field.onChange}
                {...gatewayFieldArgs}
                sx={{ minWidth: 220 }}
              />
            )}
          />

          <Controller
            name="paymentDate"
            control={control}
            render={({ field }) => (
              <DesktopAppDatePicker
                label={t.form.paymentDate}
                value={field.value ? new Date(field.value) : null}
                onChange={date => field.onChange(date ? date.toISOString().slice(0, 10) : "")}
                slotProps={{ textField: { size: "small", sx: { minWidth: 200 } } }}
              />
            )}
          />

          <PaymentPaidStatusControllerField
            control={control}
            onLabel={t.form.paidToggleOn}
            offLabel={t.form.paidToggleOff}
          />
        </Stack>

        <PaymentNoteControllerField
          control={control}
          name="paymentNote"
          label={t.form.note}
          placeholder={t.form.notePlaceholder}
        />
      </Stack>
    </DesktopSectionPanel>
  );
}
