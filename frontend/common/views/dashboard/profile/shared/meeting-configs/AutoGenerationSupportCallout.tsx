"use client";

import { Collapse, Stack } from "@mui/material";
import { useId, useState } from "react";
import { BaseCard } from "@/frontend/common/components/ui";
import {
  CollapsedSummary,
  ExpandedGuide,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/AutoGenerationSupportCallout.parts";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

export type AutoGenerationSupportCalloutProps = {
  readonly labels: ProfileNotificationsLabels["autoGeneration"];
  readonly onCreateConfig?: () => void;
  readonly createConfigHref?: string;
};

export function AutoGenerationSupportCallout({
  labels,
  onCreateConfig,
  createConfigHref,
}: AutoGenerationSupportCalloutProps) {
  const reactId = useId();
  const sanitizedId = reactId.replace(/[^a-zA-Z0-9]/gu, "");
  const contentId = `auto-gen-content-${sanitizedId}`;
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => setExpanded(prev => !prev);

  return (
    <BaseCard sx={theme => ({ bgcolor: theme.palette.info.main })}>
      <Stack spacing={1.5}>
        <CollapsedSummary labels={labels} expanded={expanded} onToggle={handleToggle} contentId={contentId} />
        <Collapse in={expanded} id={contentId}>
          <ExpandedGuide labels={labels} onCreateConfig={onCreateConfig} createConfigHref={createConfigHref} />
        </Collapse>
      </Stack>
    </BaseCard>
  );
}
