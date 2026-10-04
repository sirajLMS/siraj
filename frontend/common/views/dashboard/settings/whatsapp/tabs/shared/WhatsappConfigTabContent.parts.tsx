import { BoltOutlined, ContentCopyOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import type { WhatsappConfigurationFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { mobileContentGutterBelowMdSx } from "@/frontend/common/utils/sx/mobileContentGutterSx";
import {
  ConfigField,
  ConfigSecretField,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/WhatsappConfigTabContent.fields";
import {
  clearableHelper,
  secretHelper,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/WhatsappConfigTabContent.helpers";
import type { WhatsappConfigTabViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappConfigView.types";
import { WHATSAPP_CONFIG_FIELD_MAX_LENGTHS } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappConfigFormValidation";

/** Verify-token input with the generate/copy affordances beside it. */
function VerifyTokenField({
  vm,
  readOnly,
  tokenValue,
}: Readonly<{ vm: WhatsappConfigTabViewModel; readOnly: boolean; tokenValue: string }>) {
  const t = vm.labels;
  return (
    <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <ConfigField
            label={t.configVerifyToken}
            value={tokenValue}
            helper={clearableHelper(t.configVerifyTokenHelper, t.configClearHint)}
            errorKey={vm.fieldErrors.verifyToken}
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
  );
}

/** Credential fields grid: plain, secret and token fields in their two-column layout. */
export function CredentialFieldsSection({
  vm,
  config,
  readOnly,
}: Readonly<{ vm: WhatsappConfigTabViewModel; config: WhatsappConfigurationFieldsFragment; readOnly: boolean }>) {
  const { labels: t, values, fieldErrors } = vm;
  return (
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
        helper={secretHelper(config.appSecret ?? null, t, "")}
        errorKey={fieldErrors.appSecret}
        maxLength={WHATSAPP_CONFIG_FIELD_MAX_LENGTHS.appSecret}
        labels={t}
        disabled={readOnly}
        onChange={value => vm.onFieldChange("appSecret", value)}
      />
      <VerifyTokenField vm={vm} readOnly={readOnly} tokenValue={values.verifyToken} />
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
        helper={secretHelper(config.accessToken ?? null, t, t.configAccessTokenHelper)}
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
  );
}
