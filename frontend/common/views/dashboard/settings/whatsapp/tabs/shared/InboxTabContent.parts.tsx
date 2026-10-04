import { BlockOutlined, ForumOutlined, HistoryToggleOffOutlined, LockOutlined } from "@mui/icons-material";
import { Alert, Stack, type Theme, Typography } from "@mui/material";
import { MOBILE_CONTENT_GUTTER, mobileContentGutterBelowMdSx } from "@/frontend/common/utils/sx/mobileContentGutterSx";
import type { WhatsappInboxLabels } from "@/shared/locale/types/whatsappInbox";

const emptyStateCardSx = (theme: Theme) => ({
  alignItems: "center",
  textAlign: "center" as const,
  py: 8,
  px: 2,
  borderRadius: 2,
  border: `1px solid ${theme.palette.outlineVariant}`,
  [theme.breakpoints.down("md")]: { paddingInline: theme.spacing(MOBILE_CONTENT_GUTTER) },
});

/** Persistent info banner clarifying the inbox is strictly read-only. */
export function ReadOnlyBanner({ labels }: Readonly<{ labels: WhatsappInboxLabels }>) {
  return (
    <Alert
      severity="info"
      variant="outlined"
      component="div"
      icon={<LockOutlined fontSize="small" />}
      sx={mobileContentGutterBelowMdSx}
    >
      <Typography variant="labelUppercase">{labels.readOnlyBannerTitle}</Typography>
      <Typography variant="bodyMd">{labels.readOnlyNotice}</Typography>
    </Alert>
  );
}

/** Warning banner for a filtered number whose history sync was declined. */
export function DeclinedSyncBanner({ labels }: Readonly<{ labels: WhatsappInboxLabels }>) {
  return (
    <Alert
      severity="warning"
      component="div"
      icon={<HistoryToggleOffOutlined fontSize="small" />}
      sx={mobileContentGutterBelowMdSx}
    >
      <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
        {labels.syncDeclinedTitle}
      </Typography>
      <Typography variant="bodyMd">{labels.historyDeclinedNotice}</Typography>
    </Alert>
  );
}

/** Centered empty card: icon, bold heading and explainer (incl. the 24h coexistence hint). */
export function EmptyStateCard({ labels }: Readonly<{ labels: WhatsappInboxLabels }>) {
  return (
    <Stack spacing={2} sx={emptyStateCardSx}>
      <ForumOutlined sx={{ fontSize: 40, color: theme => theme.palette.text.secondary }} />
      <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
        {labels.noConversations}
      </Typography>
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, maxWidth: 480 }}>
        {labels.emptyStateDescription}
      </Typography>
    </Stack>
  );
}

/** Short centered marker below the declined-sync banner; the guidance copy lives in the banner only. */
export function DeclinedEmptyState({ labels }: Readonly<{ labels: WhatsappInboxLabels }>) {
  return (
    <Stack spacing={1.5} sx={emptyStateCardSx}>
      <BlockOutlined sx={{ fontSize: 40, color: theme => theme.palette.text.secondary }} />
      <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
        {labels.syncDeclinedEmptyTitle}
      </Typography>
    </Stack>
  );
}
