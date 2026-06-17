"use client";

import { ExpandMoreOutlined, HistoryOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Typography } from "@mui/material";
import type { ParentComplaintRecord } from "@/frontend/stores/mockParentComplaintsStore";
import type { ComplaintsParentLabels } from "@/shared/messages/types/dashboard/complaints/main";
import { ComplaintRecordCard } from "./ComplaintRecordCard";

interface ComplaintRecordCardListProps {
  readonly records: readonly ParentComplaintRecord[];
  readonly labels: ComplaintsParentLabels;
  readonly hasOlderRecords: boolean;
  readonly onLoadOlderRecords: () => void;
}

export function ComplaintRecordCardList({
  records,
  labels,
  hasOlderRecords,
  onLoadOlderRecords,
}: Readonly<ComplaintRecordCardListProps>) {
  const totalLabel = labels.totalRecords.replace("{count}", String(records.length));

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <HistoryOutlined sx={theme => ({ color: theme.palette.primary.main })} />
          <Typography variant="titleLg">{labels.recordTitle}</Typography>
        </Box>
        <Chip label={totalLabel} size="small" sx={theme => ({ bgcolor: theme.palette.surfaceContainerHigh })} />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {records.map(record => (
          <ComplaintRecordCard key={record.id} record={record} labels={labels} />
        ))}
      </Box>

      {hasOlderRecords ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Button
            onClick={onLoadOlderRecords}
            endIcon={<ExpandMoreOutlined />}
            sx={theme => ({
              color: theme.palette.primary.main,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            })}
          >
            {labels.loadOlder}
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
