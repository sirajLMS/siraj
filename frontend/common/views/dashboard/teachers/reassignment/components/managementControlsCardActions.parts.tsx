"use client";

import { CheckCircleOutlined, InfoOutlined } from "@mui/icons-material";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import type { ManagementControlsLabels } from "@/frontend/common/views/dashboard/teachers/reassignment/components/managementControlsCardFields.parts";
import type { ManagementControlsCardSlotProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types/managementControlsCardShared.types";

export function ActionButtons({
  loading,
  saved,
  onCancel,
  labels,
  CancelAction,
  SubmitAction,
}: Readonly<{
  loading: boolean;
  saved: boolean;
  onCancel: () => void;
  labels: ManagementControlsLabels["actions"];
  CancelAction: ManagementControlsCardSlotProps["CancelAction"];
  SubmitAction: ManagementControlsCardSlotProps["SubmitAction"];
}>) {
  const getSubmitContent = (): React.ReactElement => {
    if (loading) return <CircularProgress size={18} color="inherit" />;
    if (saved) return <>{labels.saved}</>;
    return <>{labels.submit}</>;
  };

  return (
    <Box
      sx={theme => ({
        pt: 3,
        borderTop: `1px solid ${theme.palette.border.main}`,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      })}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={theme => ({ alignItems: "center", color: theme.palette.onSurfaceVariant })}
      >
        <InfoOutlined fontSize="small" sx={theme => ({ color: theme.palette.primary.main })} />
        <Typography variant="labelSm">{labels.info}</Typography>
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
        <CancelAction onClick={onCancel} fullWidth sx={{ flex: 1 }}>
          {labels.cancel}
        </CancelAction>
        <SubmitAction
          type="submit"
          disabled={loading || saved}
          startIcon={saved ? <CheckCircleOutlined /> : undefined}
          fullWidth
          sx={{ flex: 1 }}
        >
          {getSubmitContent()}
        </SubmitAction>
      </Stack>
    </Box>
  );
}
