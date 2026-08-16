"use client";

import { LockOutlined } from "@mui/icons-material";
import { Box, CircularProgress, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { OptInTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";

interface OptInTabContentProps extends OptInTabSharedProps {
  /**
   * Platform-specific history table/list rendered below the toggle section.
   * Desktop wrappers pass an AppDataGrid; mobile wrappers pass a MobileCardList.
   */
  readonly historySection?: ReactNode;
  /**
   * Platform-specific admin consolidated view rendered below the history
   * section (Task 13). Desktop wrappers pass an AppDataGrid with search;
   * mobile wrappers pass a MobileCardList with search. The shared layer
   * wraps this section in `RequirePermission` with `WhatsappConfigManage`.
   */
  readonly adminSection?: ReactNode;
}

/**
 * Shared inner content for OptInTab — used by both desktop and mobile wrappers.
 *
 * Renders:
 * 1. The opt-in toggle (Switch + consent copy) — existing behaviour preserved.
 * 2. The audit history section title/subtitle + platform-specific table/list
 *    passed via `historySection` prop (Task 12). The shared layer renders the
 *    section header; the platform wrapper renders the actual AppDataGrid
 *    (desktop) or MobileCardList (mobile).
 * 3. The admin consolidated opt-in view wrapped in `RequirePermission` with
 *    `AppPermission.WhatsappConfigManage` (Task 13). The shared layer renders
 *    the section header; the platform wrapper renders the actual admin table
 *    with search filter via `adminSection` prop.
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
      {/* ── Toggle section (existing) ── */}
      <Stack spacing={2}>
        <Box>
          <Typography variant="titleLg">{t.optInTitle}</Typography>
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mt: 0.5 }}>
            {t.optInSubtitle}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 1,
            border: theme => `1px solid ${theme.palette.outlineVariant}`,
          }}
        >
          {optInLoading ? (
            <Box component="output" sx={{ display: "flex", justifyContent: "center" }} aria-busy>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <FormControlLabel
              control={<Switch checked={isOptedIn} onChange={e => onToggleOptIn(e.target.checked)} />}
              label={t.optInToggle}
              sx={{ gap: 1.5 }}
            />
          )}
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mt: 1, display: "block" }}>
            {t.optInConsentBody}
          </Typography>
          <Typography
            variant="labelMd"
            sx={{
              mt: 1,
              display: "block",
              color: theme => (isOptedIn ? theme.palette.success.main : theme.palette.text.secondary),
            }}
          >
            {isOptedIn ? t.optInEnabled : t.optInDisabled}
          </Typography>
        </Box>
      </Stack>

      {/* ── History section (Task 12) ── */}
      <Stack spacing={2}>
        <Box>
          <Typography variant="titleLg">{t.optInHistoryTitle}</Typography>
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mt: 0.5 }}>
            {t.optInHistorySubtitle}
          </Typography>
        </Box>

        {historySection}
      </Stack>

      {/* ── Admin consolidated opt-in view (Task 13) ── */}
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
          <Box>
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
