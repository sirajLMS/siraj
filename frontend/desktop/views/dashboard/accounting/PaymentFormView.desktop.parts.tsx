"use client";

import { SaveOutlined, SyncOutlined } from "@mui/icons-material";
import { Box, CircularProgress, Stack } from "@mui/material";
import Link from "next/link";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { PaymentNoteField } from "@/frontend/common/views/dashboard/accounting/components/PaymentFormFields";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopPageContainer } from "@/frontend/desktop/components/ui/container/page";

const spinIcon = (
  <SyncOutlined
    sx={{ animation: "spin 1s linear infinite", "@keyframes spin": { to: { transform: "rotate(360deg)" } } }}
  />
);

export function PaymentFormLoadingState() {
  return (
    <DesktopPageContainer>
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress size={36} />
      </Box>
    </DesktopPageContainer>
  );
}

interface PaymentFormActionsProps {
  readonly isSubmitting: boolean;
  readonly submitLabel: string;
  readonly savingLabel: string;
  readonly cancelLabel: string;
}

export function PaymentFormActions({
  isSubmitting,
  submitLabel,
  savingLabel,
  cancelLabel,
}: Readonly<PaymentFormActionsProps>) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
      <Link href="/accounting/payments" style={{ textDecoration: "none" }}>
        <DesktopPrimaryPageAction variant="text" color="inherit" disabled={isSubmitting}>
          {cancelLabel}
        </DesktopPrimaryPageAction>
      </Link>
      <DesktopPrimaryPageAction
        type="submit"
        disabled={isSubmitting}
        startIcon={isSubmitting ? spinIcon : <SaveOutlined />}
      >
        {isSubmitting ? savingLabel : submitLabel}
      </DesktopPrimaryPageAction>
    </Stack>
  );
}

interface PaymentNoteControllerFieldProps<TValues extends FieldValues, TTransformed> {
  readonly control: Control<TValues, undefined, TTransformed>;
  readonly name: FieldPath<TValues>;
  readonly label: string;
  readonly placeholder: string;
}

/** Note textarea bound via react-hook-form Controller; shared by the create and edit payment forms. */
export function PaymentNoteControllerField<TValues extends FieldValues, TTransformed>({
  control,
  name,
  label,
  placeholder,
}: Readonly<PaymentNoteControllerFieldProps<TValues, TTransformed>>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <PaymentNoteField
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          label={label}
          placeholder={placeholder}
        />
      )}
    />
  );
}
