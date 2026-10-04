"use client";

import { ScheduleOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { AcademicClassRow } from "@/frontend/common/views/dashboard/schedule/alerts/types";
import { MobileCardListItem } from "@/frontend/mobile/components/ui";
import { MobileCardList } from "@/frontend/mobile/components/ui/container/MobileCardList";
import {
  ClassCardActions,
  ClassCardHeader,
  ClassCardMetadata,
} from "@/frontend/mobile/views/dashboard/schedule/alerts/components/academicScheduleCardList.parts";

export interface AcademicScheduleCardListMobileLabels {
  readonly joinSession: string;
  readonly leaveClass: string;
  readonly leaveDisabledReason: string;
  readonly viewClassAudit: string;
  readonly contactAdmin: string;
  readonly active: string;
  readonly upcoming: string;
  readonly missed: string;
  readonly hold: string;
  readonly endOfSchedule: string;
}

interface AcademicScheduleCardListMobileProps {
  readonly rows: readonly AcademicClassRow[];
  readonly labels: AcademicScheduleCardListMobileLabels;
  readonly paginationOptions: ListPaginationOptions;
  readonly onLeave: (id: string) => void;
  readonly onViewClassAudit: (id: string) => void;
}

const AcademicClassCard = ({
  row,
  labels,
  onLeave,
  onViewClassAudit,
}: Readonly<{
  row: AcademicClassRow;
  labels: AcademicScheduleCardListMobileProps["labels"];
  onLeave: (id: string) => void;
  onViewClassAudit: (id: string) => void;
}>) => {
  const isMissed = row.sessionStatus === "missed";

  return (
    <MobileCardListItem variant="edge-to-edge" dimmed={isMissed}>
      <ClassCardHeader row={row} labels={labels} />
      <ClassCardMetadata row={row} />
      <ClassCardActions row={row} labels={labels} onLeave={onLeave} onViewClassAudit={onViewClassAudit} />
    </MobileCardListItem>
  );
};

const EndOfSchedule = ({ label }: Readonly<{ label: string }>) => {
  return (
    <Box sx={{ py: 4, textAlign: "center" }}>
      <Box
        sx={theme => ({
          width: "100%",
          height: 192,
          borderRadius: 0,
          backgroundColor: theme.palette.action.hover,
          border: `1px solid ${theme.palette.border.light}`,
          mb: 2,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <ScheduleOutlined sx={theme => ({ fontSize: 64, color: theme.palette.text.disabled, opacity: 0.4 })} />
      </Box>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, fontStyle: "italic" })}>
        {label}
      </Typography>
    </Box>
  );
};

export function AcademicScheduleCardListMobile({
  rows,
  labels,
  paginationOptions,
  onLeave,
  onViewClassAudit,
}: AcademicScheduleCardListMobileProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <MobileCardList
        rows={rows}
        getKey={row => row.id}
        paginationOptions={paginationOptions}
        layout="edge-to-edge"
        renderItem={row => (
          <AcademicClassCard row={row} labels={labels} onLeave={onLeave} onViewClassAudit={onViewClassAudit} />
        )}
      />
      <EndOfSchedule label={labels.endOfSchedule} />
    </Box>
  );
}
