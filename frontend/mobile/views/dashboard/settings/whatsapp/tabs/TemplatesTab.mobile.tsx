"use client";

import { Box, CircularProgress, Collapse } from "@mui/material";
import { useCallback } from "react";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import {
  TemplatesCardShared,
  TemplatesEmptySyncCta,
  TemplatesErrorState,
  TemplatesSyncHeader,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/__shared__";
import type { TemplatesTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";
import type { WhatsappTemplateRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentInset,
  MobileEmptyState,
} from "@/frontend/mobile/components/ui";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/**
 * Mobile shell for a single template card: `MobileCardListItem` wrapping a
 * clickable header region and a `Collapse` with the shared detail fields.
 * Card content is owned by `TemplatesCardShared`.
 */
function TemplateMobileCard({ template, labels }: Readonly<{ template: WhatsappTemplateRow; labels: WhatsappLabels }>) {
  return (
    <TemplatesCardShared
      template={template}
      labels={labels}
      renderShell={({ expanded, toggleExpanded, headerAriaLabel, header, details }) => (
        <MobileCardListItem variant="rounded" interactive>
          <Box onClick={toggleExpanded} aria-expanded={expanded} aria-label={headerAriaLabel}>
            {header}
          </Box>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 1.5 }}>{details}</Box>
          </Collapse>
        </MobileCardListItem>
      )}
    />
  );
}

/**
 * Mobile wrapper for TemplatesTab. Renders templates as a `MobileCardList` of
 * expandable `MobileCardListItem` cards with client-side pagination (rows are
 * an in-memory snapshot from the ViewModel). Horizontal gutter is owned by
 * `MobileContentInset` (chrome blocks) and the list's `rounded` layout — the
 * tab adds no outer padding of its own.
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
    (template: WhatsappTemplateRow) => <TemplateMobileCard template={template} labels={t} />,
    [t]
  );

  // ── Loading state ──
  if (loading && !syncing) {
    return (
      <MobileContentInset>
        <Box component="output" sx={{ display: "flex", justifyContent: "center", py: 4 }} aria-busy>
          <CircularProgress size={32} />
        </Box>
      </MobileContentInset>
    );
  }

  // ── Error state with retry ──
  if (queryError) {
    return (
      <MobileContentInset>
        <TemplatesErrorState
          labels={t}
          syncing={syncing}
          isConfigured={isConfigured}
          onSyncFromMeta={onSyncFromMeta}
          onRetry={onRetry}
        />
      </MobileContentInset>
    );
  }

  return (
    <>
      <MobileContentInset>
        <TemplatesSyncHeader labels={t} syncing={syncing} isConfigured={isConfigured} onSyncFromMeta={onSyncFromMeta} />
      </MobileContentInset>

      {templates.length === 0 ? (
        <MobileContentInset>
          <TemplatesEmptySyncCta
            labels={t}
            syncing={syncing}
            isConfigured={isConfigured}
            onSyncFromMeta={onSyncFromMeta}
          />
        </MobileContentInset>
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
    </>
  );
}
