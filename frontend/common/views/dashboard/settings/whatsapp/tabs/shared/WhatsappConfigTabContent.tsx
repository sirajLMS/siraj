"use client";

import { BoltOutlined, ContentCopyOutlined, NetworkCheckOutlined, SaveOutlined } from "@mui/icons-material";
import { Alert, Box, Button, CircularProgress, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { FormErrorSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormErrorSnackbar";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { SecretTextField } from "@/frontend/common/components/ui/input/secretTextField";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { mobileContentGutterBelowMdSx } from "@/frontend/common/utils/sx/mobileContentGutterSx";
import type {
  WhatsappConfigTabViewModel,
  WhatsappConfigValidationKey,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappConfigView.types";
import { WHATSAPP_CONFIG_FIELD_MAX_LENGTHS } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappConfigFormValidation";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

// ─── Field scaffolding ───────────────────────────────────────────────

interface ConfigFieldProps {
  readonly label: string;
  readonly value: string;
  readonly helper: string;
  readonly errorKey: WhatsappConfigValidationKey | null | undefined;
  /** Mirrored server cap for the field — the browser blocks longer input. */
  readonly maxLength?: number;
  readonly labels: WhatsappLabels;
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
}

/** Plain text field that swaps its helper for the localized validation message. */
function ConfigField({
  label,
  value,
  helper,
  errorKey,
  maxLength,
  labels,
  disabled,
  onChange,
}: Readonly<ConfigFieldProps>) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={event => onChange(event.target.value)}
      helperText={errorKey ? labels[errorKey] : helper}
      error={Boolean(errorKey)}
      disabled={disabled}
      fullWidth
      autoComplete="off"
      slotProps={{ htmlInput: { maxLength } }}
    />
  );
}

interface ConfigSecretFieldProps {
  readonly label: string;
  readonly value: string;
  readonly helper: string;
  readonly errorKey?: WhatsappConfigValidationKey | null;
  /** Mirrored server cap for the field — the browser blocks longer input. */
  readonly maxLength: number;
  readonly labels: WhatsappLabels;
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
}

/** Masked secret input with a reveal toggle; the stored value stays server-masked. */
function ConfigSecretField({
  label,
  value,
  helper,
  errorKey,
  maxLength,
  labels,
  disabled,
  onChange,
}: Readonly<ConfigSecretFieldProps>) {
  const [revealed, setRevealed] = useState(false);

  return (
    <SecretTextField
      label={label}
      value={value}
      onChange={event => onChange(event.target.value)}
      helperText={errorKey ? labels[errorKey] : helper}
      error={Boolean(errorKey)}
      disabled={disabled}
      maxLength={maxLength}
      revealed={revealed}
      onToggleReveal={() => setRevealed(previous => !previous)}
      showValueLabel={labels.configShowSecret}
      hideValueLabel={labels.configHideSecret}
    />
  );
}

/** Masked-secret helper caption: stored-value indicator plus optional field guidance. */
function secretHelper(storedMaskedValue: string | null, labels: WhatsappLabels, extraHelper: string): string {
  const storedPart = storedMaskedValue ? labels.configSecretStored(storedMaskedValue) : labels.configSecretNotSet;
  return extraHelper ? `${storedPart} ${extraHelper}` : storedPart;
}

/**
 * Appends the destructive-clear notice to a visible field's guidance: for
 * these fields an emptied input submits an explicit null, which REMOVES the
 * stored value on save (merge semantics of the mutation).
 */
function clearableHelper(helper: string, clearHint: string): string {
  return `${helper} ${clearHint}`;
}

// ─── Shared content ──────────────────────────────────────────────────

/**
 * Shared inner content for the WhatsApp Cloud API configuration tab — used by
 * both the desktop and mobile tier wrappers. Renders the configuration form
 * (per-field grid), the verify-token generate/copy row, the read-only webhook
 * callback URL with setup guidance, the connection-test alert, and the
 * save/test actions. All state and handlers come from the configuration
 * ViewModel; this component owns only the local reveal toggles.
 */
export function WhatsappConfigTabContent(vm: Readonly<WhatsappConfigTabViewModel>) {
  const { labels: t, values, fieldErrors, config } = vm;
  const readOnly = !vm.canManage;

  const tokenValue = values.verifyToken;
  const webhookUrl = config?.webhookUrl ?? "";

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

      {vm.loading && !config ? (
        <Box component="output" sx={{ display: "flex", justifyContent: "center", py: 6 }} aria-busy>
          <CircularProgress size={28} />
        </Box>
      ) : config ? (
        <>
          {/* ── Credential fields ── */}
          <Box
            sx={mergeSx(mobileContentGutterBelowMdSx, {
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            })}
          >
            <ConfigField
              label={t.configAppId}
              value={values.appId}
              helper={clearableHelper(t.configAppIdHelper, t.configClearHint)}
              errorKey={fieldErrors.appId}
              maxLength={WHATSAPP_CONFIG_FIELD_MAX_LENGTHS.appId}
              labels={t}
              disabled={readOnly}
              onChange={value => vm.onFieldChange("appId", value)}
            />
            <ConfigSecretField
              label={t.configAppSecret}
              value={values.appSecret}
              helper={secretHelper(config?.appSecret ?? null, t, "")}
              errorKey={fieldErrors.appSecret}
              maxLength={WHATSAPP_CONFIG_FIELD_MAX_LENGTHS.appSecret}
              labels={t}
              disabled={readOnly}
              onChange={value => vm.onFieldChange("appSecret", value)}
            />
            <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", width: "100%" }}>
                <Box sx={{ flex: 1 }}>
                  <ConfigField
                    label={t.configVerifyToken}
                    value={tokenValue}
                    helper={clearableHelper(t.configVerifyTokenHelper, t.configClearHint)}
                    errorKey={fieldErrors.verifyToken}
                    maxLength={WHATSAPP_CONFIG_FIELD_MAX_LENGTHS.verifyToken}
                    labels={t}
                    disabled={readOnly}
                    onChange={value => vm.onFieldChange("verifyToken", value)}
                  />
                </Box>
                <Tooltip title={t.configGenerateTokenHint}>
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<BoltOutlined />}
                      disabled={readOnly || vm.generating}
                      onClick={() => void vm.onGenerateToken()}
                      aria-label={t.configGenerateTokenHint}
                    >
                      {t.configGenerateToken}
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title={t.configCopyToken}>
                  <span>
                    <IconButton
                      aria-label={t.configCopyToken}
                      disabled={tokenValue.length === 0}
                      onClick={() => vm.onCopy(tokenValue)}
                    >
                      <ContentCopyOutlined fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>
            <ConfigField
              label={t.configPhoneNumberId}
              value={values.phoneNumberId}
              helper={clearableHelper(t.configPhoneNumberIdHelper, t.configClearHint)}
              errorKey={fieldErrors.phoneNumberId}
              maxLength={WHATSAPP_CONFIG_FIELD_MAX_LENGTHS.phoneNumberId}
              labels={t}
              disabled={readOnly}
              onChange={value => vm.onFieldChange("phoneNumberId", value)}
            />
            <ConfigField
              label={t.configWabaId}
              value={values.wabaId}
              helper={clearableHelper(t.configWabaIdHelper, t.configClearHint)}
              errorKey={fieldErrors.wabaId}
              maxLength={WHATSAPP_CONFIG_FIELD_MAX_LENGTHS.wabaId}
              labels={t}
              disabled={readOnly}
              onChange={value => vm.onFieldChange("wabaId", value)}
            />
            <ConfigSecretField
              label={t.configAccessToken}
              value={values.accessToken}
              helper={secretHelper(config?.accessToken ?? null, t, t.configAccessTokenHelper)}
              errorKey={fieldErrors.accessToken}
              maxLength={WHATSAPP_CONFIG_FIELD_MAX_LENGTHS.accessToken}
              labels={t}
              disabled={readOnly}
              onChange={value => vm.onFieldChange("accessToken", value)}
            />
            <ConfigField
              label={t.configEsConfigId}
              value={values.esConfigId}
              helper={clearableHelper(t.configEsConfigIdHelper, t.configClearHint)}
              errorKey={fieldErrors.esConfigId}
              maxLength={WHATSAPP_CONFIG_FIELD_MAX_LENGTHS.esConfigId}
              labels={t}
              disabled={readOnly}
              onChange={value => vm.onFieldChange("esConfigId", value)}
            />
          </Box>

          {/* ── Webhook callback URL (read-only) ── */}
          <Box sx={mobileContentGutterBelowMdSx}>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <TextField
                label={t.configWebhookUrl}
                value={webhookUrl}
                helperText={t.configWebhookUrlHelper}
                fullWidth
                slotProps={{ input: { readOnly: true } }}
              />
              <Tooltip title={t.configCopyWebhookUrl}>
                <span>
                  <IconButton
                    aria-label={t.configCopyWebhookUrl}
                    disabled={webhookUrl.length === 0}
                    onClick={() => vm.onCopy(webhookUrl)}
                  >
                    <ContentCopyOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mt: 1 }}>
              {t.configWebhookUrlGuidance}
            </Typography>
          </Box>

          {/* ── Connection-test result ── */}
          {vm.connectionResult && (
            <Box sx={mobileContentGutterBelowMdSx}>
              <Alert severity={vm.connectionResult.success ? "success" : "error"}>
                <Stack spacing={0.5}>
                  <Typography variant="bodyMd">{vm.connectionResult.message}</Typography>
                  {vm.connectionResult.success && vm.connectionResult.phoneNumber && (
                    <Typography variant="bodyMd">
                      {t.configConnectionPhoneNumber}: {vm.connectionResult.phoneNumber}
                    </Typography>
                  )}
                </Stack>
              </Alert>
            </Box>
          )}

          {/* ── Actions ── */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={mergeSx(mobileContentGutterBelowMdSx, { alignItems: { sm: "center" } })}
          >
            <Button
              variant="outlined"
              startIcon={<NetworkCheckOutlined />}
              disabled={readOnly || vm.testing || vm.saving}
              onClick={() => void vm.onTestConnection()}
            >
              {t.configTestConnection}
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveOutlined />}
              disabled={readOnly || !vm.dirty || vm.saving || vm.testing || Object.values(fieldErrors).some(Boolean)}
              onClick={() => void vm.onSave()}
            >
              {t.configSaveChanges}
            </Button>
          </Stack>
        </>
      )}

      {/* ── Snackbar ── */}
      {vm.snackbar && vm.snackbar.severity === "error" ? (
        <FormErrorSnackbar open onClose={vm.onDismissSnackbar} message={vm.snackbar.message} />
      ) : vm.snackbar ? (
        <FormSuccessSnackbar open onClose={vm.onDismissSnackbar} message={vm.snackbar.message} />
      ) : null}
    </Stack>
  );
}
