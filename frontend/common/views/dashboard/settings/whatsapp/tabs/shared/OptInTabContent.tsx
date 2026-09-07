"use client";

import { LockOutlined } from "@mui/icons-material";
import { Alert, Box, Chip, CircularProgress, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { BaseCard, getStatusColors } from "@/frontend/common/components/ui";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { mobileContentGutterBelowMdSx } from "@/frontend/common/utils/sx/mobileContentGutterSx";
import type { OptInTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";

interface OptInTabContentProps extends OptInTabSharedProps {
  /**
   * Platform-specific history table/list rendered below the toggle section.
   * Desktop wrappers pass an AppDataGrid; mobile wrappers pass a MobileCardList.
   */
  readonly historySection?: ReactNode;
  /**
   * Platform-specific admin consolidated view rendered below the history
   * section. Desktop wrappers pass an AppDataGrid with search; mobile wrappers
   * pass a MobileCardList with search. The shared layer wraps this section in
   * `RequirePermission` with `WhatsappConfigManage`.
   */
  readonly adminSection?: ReactNode;
}

/**
 * Shared inner content for OptInTab — used by both desktop and mobile wrappers.
 *
 * Renders:
 * 1. The opt-in toggle — a `BaseCard` containing the Switch (existing behavior
 *    preserved), its consent copy, and a `Chip` reflecting the
 *    enabled/disabled state.
 * 2. The audit history section: title/subtitle plus the platform-specific
 *    table/list passed via the `historySection` prop.
 * 3. The admin consolidated opt-in view wrapped in `RequirePermission` with
 *    `AppPermission.WhatsappConfigManage`. The shared layer renders the
 *    section header; the platform wrapper renders the admin table with search
 *    filter via the `adminSection` prop.
 *
 * Section headers and the toggle card apply the shared mobile content gutter
 * below `md` so mobile wrappers stay edge-to-edge without their own page
 * padding.
 */
export function OptInTabContent({
  labels,
  isOptedIn,
  optInLoading,
  onToggleOptIn,
  historySection,
  adminSection,
}: Readonly<OptInTabContentProps>) {
  const t = labels.page;

  return (
    <Stack spacing={3}>
      {/* ── Toggle section ── */}
      <Stack spacing={2}>
        <Box sx={mobileContentGutterBelowMdSx}>
          <Typography variant="titleLg">{t.optInTitle}</Typography>
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mt: 0.5 }}>
            {t.optInSubtitle}
          </Typography>
        </Box>

        <Box sx={mobileContentGutterBelowMdSx}>
          <Alert severity="info">{t.optInDefaultOffBanner}</Alert>
        </Box>

        <Box sx={mobileContentGutterBelowMdSx}>
          <BaseCard>
            {optInLoading ? (
              <Box component="output" sx={{ display: "flex", justifyContent: "center" }} aria-busy>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <FormControlLabel
                control={<Switch checked={isOptedIn} onChange={e => onToggleOptIn(e.target.checked)} />}
                sx={{ gap: 1.5, alignItems: "flex-start" }}
                label={
                  <Stack spacing={0.5}>
                    <Typography variant="bodyLg">{t.optInToggle}</Typography>
                    <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
                      {t.optInConsentBody}
                    </Typography>
                  </Stack>
                }
              />
            )}
            <Box sx={{ mt: 1 }}>
              <Chip
                size="small"
                label={isOptedIn ? t.optInEnabled : t.optInDisabled}
                sx={theme => getStatusColors(theme, "syncStatus", isOptedIn ? "success" : "cancelled")}
              />
            </Box>
          </BaseCard>
        </Box>
      </Stack>

      {/* ── History section ── */}
      <Stack spacing={2}>
        <Box sx={mobileContentGutterBelowMdSx}>
          <Typography variant="titleLg">{t.optInHistoryTitle}</Typography>
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mt: 0.5 }}>
            {t.optInHistorySubtitle}
          </Typography>
        </Box>

        {historySection}
      </Stack>

      {/* ── Admin consolidated opt-in view ── */}
      <RequirePermission
        permissions={AppPermission.WhatsappConfigManage}
        fallback={
          <Stack spacing={1} sx={{ textAlign: "center", py: 4, px: 2, alignItems: "center" }} role="alert">
            <LockOutlined sx={{ fontSize: 36, color: theme => theme.palette.text.secondary }} />
            <Typography variant="titleLg">{t.permissionDeniedTitle}</Typography>
            <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
              {t.permissionDeniedDescription}
            </Typography>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <Box sx={mobileContentGutterBelowMdSx}>
            <Typography variant="titleLg">{t.optInAdminTitle}</Typography>
            <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mt: 0.5 }}>
              {t.optInAdminSubtitle}
            </Typography>
          </Box>

          {adminSection}
        </Stack>
      </RequirePermission>
    </Stack>
  );
}
