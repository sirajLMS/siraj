"use client";

import { ExpandLessOutlined, ExpandMoreOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { type ReactNode, useState } from "react";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { getLocalizedTemplateStatus } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/__shared__/whatsappTemplateStatusHelpers";
import type { WhatsappTemplateRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { getWhatsappTemplateStatusBadgeConfig } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappStatusBadge";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/**
 * Slot payload handed to the tier-owned card shell.
 *
 * The scaffold owns the card's expandable behavior and all shared content
 * (collapsed header + localized detail fields); each tier supplies its own
 * shell (desktop: `Card` + `CardActionArea` + `Collapse`, mobile:
 * `MobileCardListItem` + `Collapse`) and its own list container.
 */
export interface TemplatesCardShellSlots {
  readonly expanded: boolean;
  readonly toggleExpanded: () => void;
  /** Accessible label for the clickable expand region (`<name> — <bodyLabel>`). */
  readonly headerAriaLabel: string;
  /** Collapsed header content: name, language/category label pairs, status badge, expand icon. */
  readonly header: ReactNode;
  /** Expanded detail content: labeled language/category/status/lastSyncedAt fields. */
  readonly details: ReactNode;
}

/** A single label + value pair rendered as stacked Typography blocks. */
function TemplateLabeledValue({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Box>
      <Typography variant="labelSm" sx={{ color: theme => theme.palette.text.secondary, fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="bodyMd">{value}</Typography>
    </Box>
  );
}

/**
 * Shared scaffold for a single WhatsApp template card.
 *
 * Both tier tabs render their cards through this scaffold so the status badge
 * config, localized status label resolution, and label/value field rendering
 * stay in one place. The tier only provides the outer card shell via
 * `renderShell`.
 *
 * The `body` and `buttons` fields are not currently exposed by the
 * `WhatsappTemplateSnapshotFieldsFragment` — they can be appended to the
 * detail stack once the backend schema returns them.
 */
export function TemplatesCardShared({
  template,
  labels,
  renderShell,
}: Readonly<{
  template: WhatsappTemplateRow;
  labels: WhatsappLabels;
  renderShell: (slots: TemplatesCardShellSlots) => ReactNode;
}>) {
  const [expanded, setExpanded] = useState(false);

  const statusBadgeConfig = getWhatsappTemplateStatusBadgeConfig(template.status);
  const localizedStatus = getLocalizedTemplateStatus(template, labels);

  const header = (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
      <Box>
        <Typography variant="labelMd" sx={{ fontWeight: 700 }}>
          {template.name ?? "—"}
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mt: 1, flexWrap: "wrap", alignItems: "center" }}>
          <TemplateLabeledValue label={labels.templateLanguage} value={template.language ?? "—"} />
          <TemplateLabeledValue label={labels.templateCategory} value={template.category ?? "—"} />
          <StatusBadge {...statusBadgeConfig} label={localizedStatus} />
        </Box>
      </Box>
      {expanded ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
    </Box>
  );

  const details = (
    <Stack spacing={1.5}>
      <TemplateLabeledValue label={labels.templateLanguage} value={template.language ?? "—"} />
      <TemplateLabeledValue label={labels.templateCategory} value={template.category ?? "—"} />
      <TemplateLabeledValue label={labels.templateStatus} value={localizedStatus} />
      <TemplateLabeledValue label={labels.templateLastUpdated} value={template.lastSyncedAt ?? "—"} />
    </Stack>
  );

  return renderShell({
    expanded,
    toggleExpanded: () => setExpanded(prev => !prev),
    headerAriaLabel: `${template.name ?? labels.templateBody} — ${labels.templateBody}`,
    header,
    details,
  });
}
