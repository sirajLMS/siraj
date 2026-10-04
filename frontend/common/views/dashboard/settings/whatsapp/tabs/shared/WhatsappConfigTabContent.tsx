"use client";

import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { FormErrorSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormErrorSnackbar";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { mobileContentGutterBelowMdSx } from "@/frontend/common/utils/sx/mobileContentGutterSx";
import { CredentialFieldsSection } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/WhatsappConfigTabContent.parts";
import {
  ConfigActions,
  ConnectionResultAlert,
  WebhookUrlSection,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/WhatsappConfigTabContent.sections";
import type { WhatsappConfigTabViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappConfigView.types";

/**
 * Shared inner content for the WhatsApp Cloud API configuration tab — used by
 * both the desktop and mobile tier wrappers. Renders the configuration form
 * (per-field grid), the verify-token generate/copy row, the read-only webhook
 * callback URL with setup guidance, the connection-test alert, and the
 * save/test actions. All state and handlers come from the configuration
 * ViewModel; this component owns only the local reveal toggles.
 */
export function WhatsappConfigTabContent(vm: Readonly<WhatsappConfigTabViewModel>) {
  const { labels: t, config } = vm;
  const readOnly = !vm.canManage;

  return (
    <Stack spacing={3}>
      {/* ── Title + storage caption ── */}
      <Box sx={mobileContentGutterBelowMdSx}>
        <Typography variant="titleLg">{t.configTitle}</Typography>
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mt: 0.5 }}>
          {t.configSubtitle}
        </Typography>
        {config && (
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mt: 1 }}>
            {config.source === "db" ? t.configSourceDb : t.configSourceEnv}
          </Typography>
        )}
      </Box>

      {vm.queryError && !vm.loading && (
        <Box sx={mobileContentGutterBelowMdSx}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={vm.onRetry}>
                {t.retry}
              </Button>
            }
          >
            {t.errorGeneric}
          </Alert>
        </Box>
      )}

      {/* ── Read-only notice for viewers without the manage permission ── */}
      {readOnly && config && (
        <Box sx={mobileContentGutterBelowMdSx}>
          <Alert severity="info">{t.configReadonlyNotice}</Alert>
        </Box>
      )}

      {renderConfigBody(vm, readOnly)}

      {/* ── Snackbar ── */}
      {renderSnackbar(vm)}
    </Stack>
  );
}

function renderConfigBody(vm: Readonly<WhatsappConfigTabViewModel>, readOnly: boolean) {
  const { labels: t, config } = vm;
  if (vm.loading && !config) {
    return (
      <Box component="output" sx={{ display: "flex", justifyContent: "center", py: 6 }} aria-busy>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (!config) {
    return null;
  }
  return (
    <>
      <CredentialFieldsSection vm={vm} config={config} readOnly={readOnly} />
      <WebhookUrlSection labels={t} webhookUrl={config.webhookUrl ?? ""} onCopy={vm.onCopy} />
      {vm.connectionResult && <ConnectionResultAlert labels={t} result={vm.connectionResult} />}
      <ConfigActions vm={vm} readOnly={readOnly} />
    </>
  );
}

function renderSnackbar(vm: Readonly<WhatsappConfigTabViewModel>) {
  const snackbar = vm.snackbar;
  if (!snackbar) {
    return null;
  }
  if (snackbar.severity === "error") {
    return <FormErrorSnackbar open onClose={vm.onDismissSnackbar} message={snackbar.message} />;
  }
  return <FormSuccessSnackbar open onClose={vm.onDismissSnackbar} message={snackbar.message} />;
}
