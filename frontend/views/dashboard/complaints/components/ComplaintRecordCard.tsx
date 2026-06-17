"use client";

import { HourglassEmptyOutlined, VerifiedUserOutlined } from "@mui/icons-material";
import { Box, Paper, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/components/ui";
import type { ParentComplaintRecord } from "@/frontend/stores/mockParentComplaintsStore";
import type { ComplaintsParentLabels } from "@/shared/messages/types/dashboard/complaints/main";

interface ComplaintRecordCardProps {
  readonly record: ParentComplaintRecord;
  readonly labels: ComplaintsParentLabels;
}

function mapStatusForBadge(status: ParentComplaintRecord["status"]): string {
  if (status === "resolved") {
    return "paid";
  }

  return "pending";
}

export function ComplaintRecordCard({ record, labels }: Readonly<ComplaintRecordCardProps>) {
  const isResolved = record.status === "resolved";

  return (
    <Paper
      elevation={0}
      sx={theme => ({
        borderRadius: theme.layout.radius.card,
        border: `1px solid ${theme.palette.outlineVariant}`,
        bgcolor: theme.palette.surfaceContainerLowest,
        overflow: "hidden",
        transition: "border-color 0.15s ease",
        "&:hover": { borderColor: theme.palette.primary.main },
      })}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 2 }}>
          <Box>
            <Typography
              variant="labelMd"
              sx={theme => ({ color: theme.palette.text.secondary, textTransform: "uppercase", mb: 0.5 })}
            >
              {record.regarding}
            </Typography>
            <Typography variant="bodyLg" sx={theme => ({ fontWeight: 600, color: theme.palette.primary.main })}>
              {record.summary}
            </Typography>
          </Box>
          <StatusBadge
            category="invoice"
            status={mapStatusForBadge(record.status)}
            label={labels.statusLabels[record.status]}
          />
        </Box>

        {isResolved && record.adminResponse ? (
          <Box
            sx={theme => ({
              p: 2,
              borderRadius: theme.layout.radius.card,
              bgcolor: theme.palette.surfaceContainerLow,
              position: "relative",
            })}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <VerifiedUserOutlined sx={theme => ({ color: theme.palette.primary.main, fontSize: 18 })} />
              <Typography variant="labelMd" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
                {labels.adminResponse}
              </Typography>
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary, ml: "auto" })}>
                {record.adminResponse.answeredAt}
              </Typography>
            </Box>
            <Typography variant="bodyMd" sx={theme => ({ fontStyle: "italic", color: theme.palette.onSurfaceVariant })}>
              &ldquo;{record.adminResponse.text}&rdquo;
            </Typography>
          </Box>
        ) : (
          <Box
            sx={theme => ({
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              color: theme.palette.text.secondary,
              py: 1,
              borderTop: `1px dashed ${theme.palette.outlineVariant}`,
              mt: 1,
            })}
          >
            <HourglassEmptyOutlined sx={{ fontSize: 20 }} />
            <Typography variant="labelMd">{labels.waitingMessage}</Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
