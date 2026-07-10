"use client";

import { useMutation } from "@apollo/client/react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AppDatePicker } from "@/frontend/components/ui/form/date/AppDatePicker";
import { CurrencySelect } from "@/frontend/components/ui/input/currencySelect/CurrencySelect";
import { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { upsertManualExchangeRateMutationDocument } from "@/frontend/graphql/sharedDocuments";
import { getCurrencyByCode } from "@/frontend/lib/currency";
import { logger } from "@/frontend/utils/logger";
import type { ExchangeRatesLabels } from "@/shared/messages/types/dashboard/billing/exchange-rates";

type ManualOverrideDialogProps = {
  readonly open: boolean;
  readonly labels: ExchangeRatesLabels["manualOverride"];
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  readonly onError: (message: string) => void;
};

export function ManualOverrideDialog({ open, labels, onClose, onSuccess, onError }: ManualOverrideDialogProps) {
  const tActions = useTranslations("dashboard.billing.currencyHedges");
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>(CurrencyCode.Usd);
  const [toCurrency, setToCurrency] = useState<CurrencyCode>(CurrencyCode.Sar);
  const [rate, setRate] = useState("");
  const [effectiveDate, setEffectiveDate] = useState<Date | null>(new Date());

  const [upsertRate, { loading }] = useMutation(upsertManualExchangeRateMutationDocument, {
    onCompleted: () => {
      onSuccess();
      onClose();
    },
    onError: error => {
      logger.error("Manual exchange rate upsert failed", { error });
      onError(labels.failed);
    },
  });

  const handleSubmit = async () => {
    if (!rate.trim()) {
      onError(labels.failed);
      return;
    }

    await upsertRate({
      variables: {
        fromCurrency,
        toCurrency,
        rate: rate.trim(),
        effectiveDate: effectiveDate ? new Date(effectiveDate).toISOString() : null,
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{labels.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <CurrencySelect
            currency={getCurrencyByCode(fromCurrency) ?? null}
            setCurrencyAction={option => setFromCurrency(option.code)}
            label={labels.fromCurrency}
            fullWidth
          />
          <CurrencySelect
            currency={getCurrencyByCode(toCurrency) ?? null}
            setCurrencyAction={option => setToCurrency(option.code)}
            label={labels.toCurrency}
            fullWidth
          />
          <TextField
            label={labels.rate}
            value={rate}
            onChange={event => setRate(event.target.value)}
            fullWidth
            inputMode="decimal"
          />
          <AppDatePicker
            label={labels.effectiveDate}
            value={effectiveDate}
            onChange={setEffectiveDate}
            slotProps={{
              textField: {
                fullWidth: true,
                slotProps: { htmlInput: { autoComplete: "off" } },
              },
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tActions("cancel")}</Button>
        <Button variant="contained" onClick={() => void handleSubmit()} disabled={loading}>
          {labels.submit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
