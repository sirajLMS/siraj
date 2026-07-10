"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { SectionPanel } from "@/frontend/components/ui";
import { AppPermission, FxProvider, FxProviderConfigSource } from "@/frontend/graphql/generated/gql/graphql-types";
import { fxProviderConfigQueryDocument, updateFxProviderMutationDocument } from "@/frontend/graphql/sharedDocuments";
import { logger } from "@/frontend/utils/logger";
import type { ExchangeRatesLabels } from "@/shared/messages/types/dashboard/billing/exchange-rates";

type ProviderSettingsSectionProps = {
  readonly labels: ExchangeRatesLabels["providerSettings"];
  readonly onFeedback: (message: string, severity: "success" | "error") => void;
};

export function ProviderSettingsSection({ labels, onFeedback }: ProviderSettingsSectionProps) {
  const tActions = useTranslations("dashboard.billing.currencyHedges");
  const [selectedProvider, setSelectedProvider] = useState<FxProvider>(FxProvider.Fixer);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<FxProvider | null>(null);

  const { data, loading, refetch } = useQuery(fxProviderConfigQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const [updateProvider, { loading: saving }] = useMutation(updateFxProviderMutationDocument, {
    onCompleted: () => {
      onFeedback(labels.saveSuccess, "success");
      void refetch();
    },
    onError: error => {
      logger.error("FX provider update failed", { error });
      onFeedback(labels.saveFailed, "error");
    },
  });

  const config = data?.fxProviderConfig;
  const activeProvider = config?.activeProvider ?? FxProvider.Fixer;
  const sourceLabel = config?.source === FxProviderConfigSource.Database ? labels.sourceDatabase : labels.sourceEnv;

  useEffect(() => {
    setSelectedProvider(activeProvider);
  }, [activeProvider]);

  const handleSaveClick = () => {
    if (selectedProvider === activeProvider) {
      return;
    }
    setPendingProvider(selectedProvider);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!pendingProvider) {
      return;
    }
    setConfirmOpen(false);
    await updateProvider({ variables: { provider: pendingProvider } });
    setPendingProvider(null);
  };

  return (
    <RequirePermission permissions={AppPermission.BillingManageFxProvider}>
      <SectionPanel title={labels.title}>
        <Box sx={{ display: "grid", gap: 2, maxWidth: 480 }}>
          <Typography variant="bodyMd" color="textSecondary">
            {sourceLabel}
          </Typography>
          <FormControl fullWidth disabled={loading || saving}>
            <InputLabel id="fx-provider-select-label">{labels.activeProvider}</InputLabel>
            <Select
              labelId="fx-provider-select-label"
              label={labels.activeProvider}
              value={selectedProvider}
              onChange={event => setSelectedProvider(event.target.value as FxProvider)}
            >
              <MenuItem value={FxProvider.Fixer}>Fixer</MenuItem>
              <MenuItem value={FxProvider.OpenExchangeRates}>OpenExchangeRates</MenuItem>
            </Select>
          </FormControl>
          <Box>
            <Button
              variant="contained"
              onClick={handleSaveClick}
              disabled={loading || saving || selectedProvider === activeProvider}
            >
              {tActions("save")}
            </Button>
          </Box>
        </Box>
      </SectionPanel>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{labels.confirmTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{labels.confirmBody}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{tActions("cancel")}</Button>
          <Button variant="contained" onClick={() => void handleConfirm()} disabled={saving}>
            {tActions("save")}
          </Button>
        </DialogActions>
      </Dialog>
    </RequirePermission>
  );
}
