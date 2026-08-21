import { CloudSyncOutlined, ErrorOutlined, LockOutlined, RefreshOutlined, SyncOutlined } from "@mui/icons-material";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/** Props shared by all three template shared sub-components. */
interface TemplatesSharedBlockProps {
  readonly labels: WhatsappLabels;
  readonly syncing: boolean;
  readonly isConfigured: boolean;
  readonly onSyncFromMeta: () => void | Promise<void>;
}

/** Error state with error icon, title, message, and retry button. */
export function TemplatesErrorState({
  labels,
  onRetry,
}: Readonly<TemplatesSharedBlockProps & { readonly onRetry: () => void | Promise<void> }>) {
  return (
    <Box sx={{ textAlign: "center", py: 4 }} role="alert">
      <ErrorOutlined sx={{ fontSize: 40, color: theme => theme.palette.error.main, mb: 1 }} />
      <Typography variant="titleLg" sx={{ mb: 0.5 }}>
        {labels.errorGenericTitle}
      </Typography>
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mb: 2 }}>
        {labels.errorGeneric}
      </Typography>
      <Button variant="outlined" startIcon={<RefreshOutlined />} onClick={onRetry}>
        {labels.retry}
      </Button>
    </Box>
  );
}

/** Header row with templates title, subtitle, and a sync button. */
export function TemplatesSyncHeader({
  labels,
  syncing,
  isConfigured,
  onSyncFromMeta,
}: Readonly<TemplatesSharedBlockProps>) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
      <Box>
        <Typography variant="titleLg">{labels.templatesTitle}</Typography>
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
          {labels.templatesSubtitle}
        </Typography>
      </Box>
      <Button
        variant="outlined"
        startIcon={syncing ? undefined : <CloudSyncOutlined />}
        disabled={syncing || !isConfigured}
        onClick={onSyncFromMeta}
        aria-busy={syncing}
      >
        {syncing ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            {labels.syncTemplates}
          </>
        ) : (
          labels.syncTemplates
        )}
      </Button>
    </Box>
  );
}

/** Empty state with sync icon, no-templates text, subtitle, and a permission-gated sync CTA. */
export function TemplatesEmptySyncCta({
  labels,
  syncing,
  isConfigured,
  onSyncFromMeta,
}: Readonly<TemplatesSharedBlockProps>) {
  return (
    <Box sx={{ textAlign: "center", py: 4 }}>
      <SyncOutlined sx={{ fontSize: 36, color: theme => theme.palette.text.secondary, mb: 1 }} />
      <Typography variant="titleLg" sx={{ mb: 0.5 }}>
        {labels.noTemplates}
      </Typography>
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mb: 2 }}>
        {labels.templatesSubtitle}
      </Typography>
      <RequirePermission
        permissions={AppPermission.WhatsappTemplatesManage}
        fallback={
          <Stack spacing={1} sx={{ textAlign: "center", alignItems: "center" }} role="alert">
            <LockOutlined sx={{ fontSize: 32, color: theme => theme.palette.text.secondary }} />
            <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
              {labels.permissionDenied}
            </Typography>
          </Stack>
        }
      >
        <Button
          variant="contained"
          startIcon={syncing ? undefined : <CloudSyncOutlined />}
          disabled={syncing || !isConfigured}
          onClick={onSyncFromMeta}
        >
          {syncing ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              {labels.syncTemplates}
            </>
          ) : (
            labels.syncTemplates
          )}
        </Button>
      </RequirePermission>
    </Box>
  );
}
