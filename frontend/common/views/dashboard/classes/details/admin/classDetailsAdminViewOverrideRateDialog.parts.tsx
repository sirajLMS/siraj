"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import { DialogPresets } from "@/frontend/common/components/ui/dialog/dialogPresets";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { getCurrencyByCode } from "@/frontend/common/lib/currency";
import type { OverrideRateDialogState } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsViewModel";
import type { AdminViewLabels } from "@/shared/locale";

interface OverrideRateDialogProps {
  readonly dialog: OverrideRateDialogState;
  readonly labels: AdminViewLabels;
}

// Dialog chrome uses the shared DialogPresets.info form-dialog shell; the currency field is the
// shared CurrencySelect (flag emoji + localized names) instead of raw enum MenuItems. All state
// lives in the store-backed OverrideRateDialogState.
export function OverrideRateDialog(props: Readonly<OverrideRateDialogProps>) {
  const { dialog, labels } = props;

  return (
    <Dialog {...DialogPresets.info} open={dialog.open} onClose={dialog.onClose}>
      <DialogTitle>{labels.rate.overrideRateDialogTitle}</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {labels.rate.overrideRateDialogDescription}
        </Typography>
        <TextField
          label={labels.rate.hourlyRateLabel}
          value={dialog.amount}
          onChange={event => dialog.onAmountChange(event.target.value)}
          type="text"
          fullWidth
        />
        <CurrencySelect
          currency={dialog.currency ? (getCurrencyByCode(dialog.currency) ?? null) : null}
          setCurrencyAction={selected => dialog.onCurrencyChange(selected.code)}
          onClearAction={() => dialog.onCurrencyChange(null)}
          label={labels.rate.currencyLabel}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={dialog.onClose}>{labels.rate.cancelButton}</Button>
        <Button
          onClick={() => {
            void dialog.onSubmit(true);
          }}
        >
          {labels.rate.clearOverrideButton}
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            void dialog.onSubmit(false);
          }}
        >
          {labels.rate.saveButton}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
