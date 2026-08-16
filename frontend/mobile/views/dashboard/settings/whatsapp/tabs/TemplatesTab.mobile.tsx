"use client";

import { ExpandLessOutlined, ExpandMoreOutlined } from "@mui/icons-material";
import { Box, Chip, CircularProgress, Collapse, Stack, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import {
  getLocalizedTemplateStatus,
  TemplatesEmptySyncCta,
  TemplatesErrorState,
  TemplatesSyncHeader,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/__shared__";
import type { TemplatesTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";
import type { WhatsappTemplateRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { getWhatsappTemplateStatusBadgeConfig } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappStatusBadge";
import { MobileCardListItem } from "@/frontend/mobile/components/ui/card";
import { MobileCardList } from "@/frontend/mobile/components/ui/container";
import { MobileEmptyState } from "@/frontend/mobile/components/ui/state";

/**
 * Renders a single expandable template card using `MobileCardListItem`.
 * Collapsed state shows name, language chip, and localized status badge.
 * Expand reveals language, category, status, and lastSyncedAt.
 */
function TemplateMobileCard({
  template,
  labels,
}: Readonly<{ template: WhatsappTemplateRow; labels: TemplatesTabSharedProps["labels"] }>) {
  const t = labels.page;
  const [expanded, setExpanded] = useState(false);

  const statusBadgeConfig = getWhatsappTemplateStatusBadgeConfig(template.status);
  const localizedStatus = getLocalizedTemplateStatus(template, t);

  return (
    <MobileCardListItem variant="rounded" interactive>
      <Box
        onClick={() => setExpanded(prev => !prev)}
        aria-expanded={expanded}
        aria-label={`${template.name ?? t.templateBody} — ${t.templateBody}`}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box>
            <Typography variant="labelMd" sx={{ fontWeight: 700 }}>
              {template.name ?? "—"}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap", alignItems: "center" }}>
              <Chip size="small" label={`${t.templateLanguage}: ${template.language ?? "—"}`} />
              <StatusBadge {...statusBadgeConfig} label={localizedStatus} />
            </Box>
          </Box>
          {expanded ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
        </Box>
      </Box>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
          <Box>
            <Typography variant="labelSm" sx={{ color: theme => theme.palette.text.secondary, fontWeight: 700 }}>
              {t.templateLanguage}
            </Typography>
            <Typography variant="bodyMd">{template.language ?? "—"}</Typography>
          </Box>
          <Box>
            <Typography variant="labelSm" sx={{ color: theme => theme.palette.text.secondary, fontWeight: 700 }}>
              {t.templateCategory}
            </Typography>
            <Typography variant="bodyMd">{template.category ?? "—"}</Typography>
          </Box>
          <Box>
            <Typography variant="labelSm" sx={{ color: theme => theme.palette.text.secondary, fontWeight: 700 }}>
              {t.templateStatus}
            </Typography>
            <Typography variant="bodyMd">{localizedStatus}</Typography>
          </Box>
          <Box>
            <Typography variant="labelSm" sx={{ color: theme => theme.palette.text.secondary, fontWeight: 700 }}>
              {t.templateLastUpdated}
            </Typography>
            <Typography variant="bodyMd">{template.lastSyncedAt ?? "—"}</Typography>
          </Box>
        </Stack>
        {/* Body and buttons are not yet exposed by the sync mutation snapshot fragment.
            When the backend adds them, render `t.templateBody` and `t.templateButtons` here. */}
      </Collapse>
    </MobileCardListItem>
  );
}

/**
 * Mobile wrapper for TemplatesTab. Renders templates as a `MobileCardList` with
 * expandable `MobileCardListItem` cards for template body preview. Status badges
 * use localized labels via `whatsappTemplateStatusLabels` (Task 1).
 *
 * Platform difference: mobile uses `MobileCardList` with `MobileCardListItem`
 * rounded cards; desktop delegates to the shared `TemplatesTabContent` which
 * uses `Card` + `CardActionArea` + `Collapse`.
 */
export function TemplatesTabMobile({
  labels,
  templates,
  loading,
  syncing,
  onSyncFromMeta,
  isConfigured,
  queryError,
  onRetry,
}: Readonly<TemplatesTabSharedProps>) {
  const t = labels.page;

  const paginationOptions: ListPaginationOptions = { mode: "client", pageSize: 10 };

  const renderItem = useCallback(
    (template: WhatsappTemplateRow) => <TemplateMobileCard template={template} labels={labels} />,
    [labels]
  );

  // ── Loading state ──
  if (loading && !syncing) {
    return (
      <Box sx={{ p: 2, display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  // ── Error state with retry ──
  if (queryError) {
    return (
      <Box sx={{ p: 2 }}>
        <TemplatesErrorState
          labels={t}
          syncing={syncing}
          isConfigured={isConfigured}
          onSyncFromMeta={onSyncFromMeta}
          onRetry={onRetry}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <TemplatesSyncHeader labels={t} syncing={syncing} isConfigured={isConfigured} onSyncFromMeta={onSyncFromMeta} />

      {templates.length === 0 ? (
        <TemplatesEmptySyncCta
          labels={t}
          syncing={syncing}
          isConfigured={isConfigured}
          onSyncFromMeta={onSyncFromMeta}
        />
      ) : (
        <MobileCardList
          rows={templates}
          renderItem={renderItem}
          getKey={template => template.id ?? template.name ?? ""}
          renderEmptyState={() => <MobileEmptyState title={t.noTemplates} />}
          paginationOptions={paginationOptions}
          gap={1.5}
          layout="rounded"
        />
      )}
    </Box>
  );
}
