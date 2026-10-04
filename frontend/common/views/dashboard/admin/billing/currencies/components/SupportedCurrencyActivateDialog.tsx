"use client";

import { Stack } from "@mui/material";
import { EntityFormDialog } from "@/frontend/common/components/ui/dialog";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { useActivateCurrencyDialog } from "@/frontend/common/views/dashboard/admin/billing/currencies/components/SupportedCurrencyActivateDialog.hooks";
import { ActivateCurrencyFormFields } from "@/frontend/common/views/dashboard/admin/billing/currencies/components/SupportedCurrencyActivateDialog.parts";
import type { SupportedCurrencyRow } from "@/frontend/common/views/dashboard/admin/billing/currencies/useSupportedCurrenciesViewModel";

const FORM_ID = "supported-currency-activate-form";

export interface SupportedCurrencyActivateDialogProps {
  readonly open: boolean;
  readonly row: SupportedCurrencyRow | null;
  readonly onClose: () => void;
  readonly onSaved: () => Promise<void>;
  /**
   * Currency codes already activated in the supported_currencies table. The
   * selector filters these out so operators can only pick currencies that are
   * not yet supported. The currently-edited row's code is always kept visible
   * (the field is disabled in edit mode anyway).
   */
  readonly excludedCodes?: readonly CurrencyCode[];
}

export function SupportedCurrencyActivateDialog({
  open,
  row,
  onClose,
  onSaved,
  excludedCodes,
}: Readonly<SupportedCurrencyActivateDialogProps>) {
  const {
    t,
    saving,
    isEdit,
    control,
    errors,
    title,
    onSubmit,
    onClose: handleClose,
  } = useActivateCurrencyDialog({ open, row, onClose, onSaved, excludedCodes });

  return (
    <EntityFormDialog
      open={open}
      onClose={handleClose}
      title={title}
      formId={FORM_ID}
      cancelLabel={t.cancel}
      saveLabel={t.save}
      isLoading={saving}
    >
      <Stack
        id={FORM_ID}
        component="form"
        spacing={2}
        sx={{ pt: 1 }}
        onSubmit={event => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <ActivateCurrencyFormFields
          control={control}
          errors={errors}
          isEdit={isEdit}
          excludedCodes={excludedCodes}
          t={t}
        />
      </Stack>
    </EntityFormDialog>
  );
}
