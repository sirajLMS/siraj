"use client";

import { Box, Card, CardActionArea, CardContent, CircularProgress, Collapse, Stack } from "@mui/material";
import {
  TemplatesCardShared,
  TemplatesEmptySyncCta,
  TemplatesErrorState,
  TemplatesSyncHeader,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/__shared__";
import type { TemplatesTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";
import type { WhatsappTemplateRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";

/**
 * Desktop shell for a single template card: a MUI outlined `Card` whose
 * `CardActionArea` toggles the `Collapse` region holding the shared detail
 * fields. Card content is owned by `TemplatesCardShared`.
 */
function TemplateCard({
  template,
  labels,
}: Readonly<{ template: WhatsappTemplateRow; labels: TemplatesTabSharedProps["labels"] }>) {
  return (
    <TemplatesCardShared
      template={template}
      labels={labels.page}
      renderShell={({ expanded, toggleExpanded, headerAriaLabel, header, details }) => (
        <Card variant="outlined">
          <CardActionArea onClick={toggleExpanded} aria-expanded={expanded} aria-label={headerAriaLabel}>
            <CardContent>{header}</CardContent>
          </CardActionArea>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <CardContent sx={{ pt: 0 }}>{details}</CardContent>
          </Collapse>
        </Card>
      )}
    />
  );
}

/**
 * Desktop templates tab content. Owns the desktop list container (a vertical
 * `Stack` of cards); loading, error, empty, and sync-header blocks come from
 * the shared `__shared__` blocks.
 */
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
