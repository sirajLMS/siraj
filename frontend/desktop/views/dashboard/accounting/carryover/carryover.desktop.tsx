"use client";

import { Box } from "@mui/material";
import type { CarryoverViewProps } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverContainer";
import { CarryoverDataGrid } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid";
import { CarryoverFilterBar } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverFilterBar";
import { DesktopListStateGate } from "@/frontend/common/views/dashboard/accounting/components/DesktopListStateGate";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

/**
 * Desktop layout of the carryover balance page: the filter bar lives in the
 * list panel's action row and the data grid (with its bulk toolbar and
 * aggregate footer) fills the panel body.
 */
export function CarryoverDesktopView(props: Readonly<CarryoverViewProps>) {
  const { labels, rows, isLoading, error } = props;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.title} />
      <DesktopSectionPanel title={labels.title} actions={<CarryoverFilterBar />} contentPadding={false} sx={{ mt: 3 }}>
        <DesktopListStateGate
          error={error !== null}
          loading={isLoading}
          hasRows={rows.length > 0}
          errorMessage={labels.loadError}
        >
          <Box sx={{ width: "100%", p: 2 }}>
            <CarryoverDataGrid {...props} />
          </Box>
        </DesktopListStateGate>
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
