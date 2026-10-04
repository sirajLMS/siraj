"use client";

import { DeleteOutlineOutlined, VerifiedUserOutlined } from "@mui/icons-material";
import { Box, Button, CircularProgress, IconButton, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import type {
  WhatsappRecipientPanelLabels,
  WhatsappRecipientViewRow,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

function TestRecipientStatusLine({ row }: Readonly<{ row: WhatsappRecipientViewRow }>) {
  return (
    <Stack spacing={0.5}>
      <StatusBadge category="syncStatus" status={row.statusBadgeStatus} label={row.statusLabel} />
      {row.lastCheckedText !== null && row.lastCheckedText !== "" && (
        <Typography variant="caption" sx={{ color: theme => theme.palette.text.secondary }}>
          {row.lastCheckedText}
        </Typography>
      )}
      {row.errorText !== null && row.errorText !== "" && (
        <Typography variant="caption" sx={{ color: theme => theme.palette.warning.main }}>
          {row.errorText}
        </Typography>
      )}
    </Stack>
  );
}

interface TestRecipientRowProps {
  readonly row: WhatsappRecipientViewRow;
  readonly labels: WhatsappRecipientPanelLabels;
  readonly canManage: boolean;
  readonly verifying: boolean;
  readonly onAskRemove: (recipientId: string) => void;
  readonly onVerify: (recipientId: string) => void;
}

export function TestRecipientRow({
  row,
  labels,
  canManage,
  verifying,
  onAskRemove,
  onVerify,
}: Readonly<TestRecipientRowProps>) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1.5}
      sx={{
        py: 1.5,
        alignItems: { xs: "stretch", md: "center" },
        borderTop: theme => `1px solid ${theme.palette.outlineVariant}`,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="bodyMd" dir="ltr" sx={{ fontWeight: 600, unicodeBidi: "isolate", textAlign: "start" }}>
          {row.phoneNumber}
        </Typography>
        {row.note !== null && row.note !== "" && (
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
            {row.note}
          </Typography>
        )}
      </Box>
      <TestRecipientStatusLine row={row} />
      {canManage && (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onVerify(row.id)}
            disabled={verifying}
            startIcon={verifying ? <CircularProgress size={14} /> : <VerifiedUserOutlined />}
          >
            {labels.recipientVerify}
          </Button>
          <IconButton aria-label={labels.recipientRemove} onClick={() => onAskRemove(row.id)} size="small">
            <DeleteOutlineOutlined />
          </IconButton>
        </Stack>
      )}
    </Stack>
  );
}
