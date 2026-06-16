"use client";

import { Box, Typography } from "@mui/material";
import type { ComplaintsAdminLabels } from "@/frontend/messages/types/dashboard/complaints/main";
import type { AdminComplaintRow } from "@/frontend/stores/adminComplaintsStore";
import { ComplaintQueueCard } from "./ComplaintQueueCard";

interface ComplaintQueueCardListProps {
  readonly rows: readonly AdminComplaintRow[];
  readonly labels: ComplaintsAdminLabels;
  readonly draftResponses: Readonly<Record<string, string>>;
  readonly canManage: boolean;
  readonly onDraftChange: (id: string, text: string) => void;
  readonly onAnswer: (id: string, options: { readonly sendEmail: boolean }) => void;
}

export function ComplaintQueueCardList({
  rows,
  labels,
  draftResponses,
  canManage,
  onDraftChange,
  onAnswer,
}: Readonly<ComplaintQueueCardListProps>) {
  if (rows.length === 0) {
    return (
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, py: 4, textAlign: "center" })}>
        {labels.queue.noEntries}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {rows.map(row => (
        <ComplaintQueueCard
          key={row.id}
          row={row}
          labels={labels}
          draftResponse={draftResponses[row.id] ?? ""}
          canManage={canManage}
          onDraftChange={text => {
            onDraftChange(row.id, text);
          }}
          onAnswer={options => {
            onAnswer(row.id, options);
          }}
        />
      ))}
    </Box>
  );
}
