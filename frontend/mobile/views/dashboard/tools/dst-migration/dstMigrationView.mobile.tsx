"use client";

import { ReportProblemOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { DstMigrationViewModel } from "@/frontend/common/views/dashboard/tools/dst-migration/useDstMigrationViewModel";
import { MobileContentStack, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { ConflictErrorsPanelMobile } from "@/frontend/mobile/views/dashboard/tools/dst-migration/components/conflictErrorsPanel.mobile";
import { DstMigrationMetricsRowMobile } from "@/frontend/mobile/views/dashboard/tools/dst-migration/components/dstMigrationMetricsRow.mobile";
import { UpdatedSessionsSectionMobile } from "@/frontend/mobile/views/dashboard/tools/dst-migration/components/updatedSessionsSection.mobile";
import { UpdateSchedulesButtonMobile } from "@/frontend/mobile/views/dashboard/tools/dst-migration/components/updateSchedulesButton.mobile";
import type { DstMigrationLabels } from "@/shared/locale/types/dashboard/admin/dstMigration";

type Props = Pick<
  DstMigrationViewModel,
  "labels" | "metrics" | "updatedSessions" | "conflictGroups" | "migrationStatus" | "onUpdate" | "dstOffsetDetected"
>;

function MobileInactiveNote({ labels }: { readonly labels: DstMigrationLabels }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <MobileSectionPanel title={labels.sections.inactiveVerified} />
      <Box
        sx={theme => ({
          p: 2,
          borderRadius: 3,
          backgroundColor: theme.palette.surfaceContainerLow,
          border: `1px solid ${theme.palette.outlineVariant}`,
          display: "flex",
          gap: 1.5,
        })}
      >
        <ReportProblemOutlined sx={theme => ({ color: theme.palette.warning.main })} />
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {labels.checkedEmpty.inactiveNote}
        </Typography>
      </Box>
    </Box>
  );
}

function MobileConflictsHeader({ labels }: { readonly labels: DstMigrationLabels }) {
  return <MobileSectionPanel title={labels.sections.conflictsDetected} />;
}

function MobileUpdatedHeader({ labels }: { readonly labels: DstMigrationLabels }) {
  return <MobileSectionPanel title={labels.sections.successfullyUpdated} />;
}

export function DstMigrationViewMobile({
  labels,
  metrics,
  updatedSessions,
  conflictGroups,
  migrationStatus,
  onUpdate,
  dstOffsetDetected,
}: Readonly<Props>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      <Box sx={{ mb: 3 }}>
        <UpdateSchedulesButtonMobile
          labels={labels}
          status={migrationStatus}
          onUpdate={onUpdate}
          dstOffsetDetected={dstOffsetDetected}
        />
      </Box>

      <Box sx={{ mb: 4 }}>
        <DstMigrationMetricsRowMobile labels={labels} metrics={metrics} />
      </Box>

      <MobileContentStack>
        <Box>
          <MobileConflictsHeader labels={labels} />
          <ConflictErrorsPanelMobile labels={labels} conflictGroups={conflictGroups} />
        </Box>
        <Box>
          <MobileUpdatedHeader labels={labels} />
          <UpdatedSessionsSectionMobile
            labels={labels}
            sessions={updatedSessions}
            successfulCount={metrics.successful}
          />
        </Box>
        <MobileInactiveNote labels={labels} />
      </MobileContentStack>
    </MobilePageContainer>
  );
}
