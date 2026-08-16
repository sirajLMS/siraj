"use client";

import { ExpandLessOutlined, ExpandMoreOutlined } from "@mui/icons-material";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import {
  getLocalizedTemplateStatus,
  TemplatesEmptySyncCta,
  TemplatesErrorState,
  TemplatesSyncHeader,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/__shared__";
import type { TemplatesTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";
import type { WhatsappTemplateRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { getWhatsappTemplateStatusBadgeConfig } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappStatusBadge";

/**
 * Renders a single template card with an expandable preview section.
 *
 * The collapsed card shows name, language chip, category chip, and a localized
 * `StatusBadge`. Expanding reveals a detail panel with `language`, `category`,
 * `lastSyncedAt`, and `status` (localized). The `body` and `buttons` fields are
 * not currently available in the `WhatsappTemplateSnapshotFieldsFragment` — they
 * will appear in the expand section once the backend schema exposes them.
 */
function TemplateCard({
  template,
  labels,
}: Readonly<{ template: WhatsappTemplateRow; labels: TemplatesTabSharedProps["labels"] }>) {
  const t = labels.page;
  const [expanded, setExpanded] = useState(false);

  const statusBadgeConfig = getWhatsappTemplateStatusBadgeConfig(template.status);
  const localizedStatus = getLocalizedTemplateStatus(template, t);

  return (
    <Card variant="outlined">
      <CardActionArea
        onClick={() => setExpanded(prev => !prev)}
        aria-expanded={expanded}
        aria-label={`${template.name ?? t.templateBody} — ${t.templateBody}`}
        disabled={false}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box>
              <Typography variant="labelMd" sx={{ fontWeight: 700 }}>
                {template.name ?? "—"}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap", alignItems: "center" }}>
                <Chip size="small" label={`${t.templateLanguage}: ${template.language ?? "—"}`} />
                <Chip size="small" label={`${t.templateCategory}: ${template.category ?? "—"}`} />
                <StatusBadge {...statusBadgeConfig} label={localizedStatus} />
              </Box>
            </Box>
            {expanded ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
          </Box>
        </CardContent>
      </CardActionArea>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 0 }}>
          <Stack spacing={1.5}>
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
        </CardContent>
      </Collapse>
    </Card>
  );
}

/** Shared inner content for TemplatesTab — used by both desktop and mobile wrappers. */
export function TemplatesTabContent({
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

  // ── Loading state ──
  if (loading && !syncing) {
    return (
      <Box component="output" sx={{ display: "flex", justifyContent: "center", py: 4 }} aria-busy>
        <CircularProgress size={32} />
      </Box>
    );
  }

  // ── Error state with retry ──
  if (queryError) {
    return (
      <TemplatesErrorState
        labels={t}
        syncing={syncing}
        isConfigured={isConfigured}
        onSyncFromMeta={onSyncFromMeta}
        onRetry={onRetry}
      />
    );
  }

  return (
    <Box>
      <TemplatesSyncHeader labels={t} syncing={syncing} isConfigured={isConfigured} onSyncFromMeta={onSyncFromMeta} />

      {templates.length === 0 ? (
        <TemplatesEmptySyncCta
          labels={t}
          syncing={syncing}
          isConfigured={isConfigured}
          onSyncFromMeta={onSyncFromMeta}
        />
      ) : (
        <Stack spacing={1.5}>
          {templates.map(template => (
            <TemplateCard key={template.id} template={template} labels={labels} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
