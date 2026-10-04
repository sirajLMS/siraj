import { CheckCircleOutlined, Save, SyncOutlined } from "@mui/icons-material";
import { Box, CircularProgress } from "@mui/material";
import type { ReactElement } from "react";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

export function resolveSaveIcon(isSaving: boolean, isSaved: boolean): ReactElement {
  if (isSaving) return <SyncOutlined sx={{ animation: "spin 1s linear infinite" }} />;
  if (isSaved) return <CheckCircleOutlined />;
  return <Save />;
}

export function resolveSaveText(labels: StudentQuotaLabels, isSaving: boolean, isSaved: boolean): string {
  if (isSaving) return labels.actions.saving;
  if (isSaved) return labels.actions.saved;
  return labels.actions.save;
}

export const loadingContent: ReactElement = (
  <Box component="output" aria-busy="true" sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
    <CircularProgress />
  </Box>
);
