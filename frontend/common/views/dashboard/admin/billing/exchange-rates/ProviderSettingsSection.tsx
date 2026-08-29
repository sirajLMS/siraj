"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { FilterButton, PrimaryPageAction, SectionPanel } from "@/frontend/common/components/ui";
import { DialogPresets } from "@/frontend/common/components/ui/dialog";
import { AppPermission, FxProvider, FxProviderConfigSource } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  fxProviderConfigQueryDocument,
  updateFxProviderMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { serializeApolloError } from "@/frontend/common/utils/errorUtils";
import { logger } from "@/frontend/common/utils/logger";
import { type ExchangeRatesLabels, useAppLocale } from "@/shared/locale";

type ProviderSettingsSectionProps = {
  readonly labels: ExchangeRatesLabels["providerSettings"];
  readonly onFeedback: (message: string, severity: "success" | "error") => void;
  readonly actionsDisabled?: boolean;
};

function formatAuditDate(value: string | null | undefined, locale: string): string {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProviderSettingsSection({ labels, onFeedback, actionsDisabled = false }: ProviderSettingsSectionProps) {
  const locale = useAppLocale();

  const { data, loading, refetch } = useQuery(fxProviderConfigQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const [updateProvider, { loading: saving }] = useMutation(updateFxProviderMutationDocument, {
    onCompleted: () => {
      onFeedback(labels.saveSuccess, "success");
      void refetch();
    },
    onError: error => {
      logger.error("FX provider update failed", serializeApolloError(error));
      onFeedback(labels.saveFailed, "error");
    },
  });

  const config = data?.fxProviderConfig;
  const activeProvider = config?.activeProvider ?? FxProvider.Fixer;
  const sourceLabel = config?.source === FxProviderConfigSource.Database ? labels.sourceDatabase : labels.sourceEnv;
  const lastChangedLabel =
    config?.updatedByName && config.updatedAt
      ? labels.lastChangedBy(config.updatedByName, formatAuditDate(config.updatedAt, locale))
      : null;

  const [selectedProvider, setSelectedProvider] = useState<FxProvider>(FxProvider.Fixer);
  const [prevActiveProvider, setPrevActiveProvider] = useState<FxProvider>(activeProvider);
  if (activeProvider !== prevActiveProvider) {
    setPrevActiveProvider(activeProvider);
    setSelectedProvider(activeProvider);
  }
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<FxProvider | null>(null);

  const handleSaveClick = () => {
    if (actionsDisabled || selectedProvider === activeProvider) {
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
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {sourceLabel}
          </Typography>
          {lastChangedLabel ? (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {lastChangedLabel}
            </Typography>
          ) : null}
          <FormControl fullWidth disabled={loading || saving || actionsDisabled}>
            <InputLabel id="fx-provider-select-label">{labels.activeProvider}</InputLabel>
            <Select<FxProvider>
              labelId="fx-provider-select-label"
              label={labels.activeProvider}
              value={selectedProvider}
              onChange={(event: SelectChangeEvent<FxProvider>) => setSelectedProvider(event.target.value)}
            >
              <MenuItem value={FxProvider.Fixer}>Fixer</MenuItem>
              <MenuItem value={FxProvider.OpenExchangeRates}>OpenExchangeRates</MenuItem>
            </Select>
          </FormControl>
          <Box>
            <PrimaryPageAction
              onClick={handleSaveClick}
              disabled={loading || saving || actionsDisabled || selectedProvider === activeProvider}
            >
              {labels.save}
            </PrimaryPageAction>
          </Box>
        </Box>
      </SectionPanel>

      <Dialog {...DialogPresets.confirm} open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{labels.confirmTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{labels.confirmBody}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <FilterButton disabled={saving} onClick={() => setConfirmOpen(false)}>
            {labels.cancel}
          </FilterButton>
          <PrimaryPageAction loading={saving} onClick={() => void handleConfirm()}>
            {labels.save}
          </PrimaryPageAction>
        </DialogActions>
      </Dialog>
    </RequirePermission>
  );
}
