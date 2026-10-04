"use client";

import { ScheduleOutlined } from "@mui/icons-material";
import { Box, type Theme, Typography } from "@mui/material";
import {
  resolveSaveIcon,
  resolveSaveText,
} from "@/frontend/common/views/dashboard/students/quota/components/__shared__/studentQuotaShared.helpers";
import type { StudentQuotaTierConfig } from "@/frontend/common/views/dashboard/students/quota/components/__shared__/studentQuotaShared.types";
import type { FormActionsProps } from "@/frontend/common/views/dashboard/students/quota/types";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

export function FormActionsShared({
  labels,
  isSaving,
  isSaved,
  studentData,
  onCancel,
  readOnly = false,
  showCancel = true,
  tier,
}: Readonly<FormActionsProps & { readonly labels: StudentQuotaLabels; readonly tier: StudentQuotaTierConfig }>) {
  const { PrimaryAction, actionsSx } = tier;
  const saveIcon = resolveSaveIcon(isSaving, isSaved);
  const saveText = resolveSaveText(labels, isSaving, isSaved);

  return (
    <Box
      sx={{
        pt: actionsSx.containerPaddingTop,
        display: "flex",
        flexDirection: actionsSx.containerDirection,
        alignItems: "center",
        justifyContent: "space-between",
        gap: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: actionsSx.innerDirection,
          gap: actionsSx.innerGap,
          width: actionsSx.innerWidth,
        }}
      >
        {readOnly ? null : (
          <PrimaryAction type="submit" disabled={isSaving || isSaved} startIcon={saveIcon}>
            {saveText}
          </PrimaryAction>
        )}
        {showCancel ? (
          <PrimaryAction type="button" variant="text" onClick={onCancel} disabled={isSaving}>
            {labels.actions.cancel}
          </PrimaryAction>
        ) : null}
      </Box>

      {studentData.lastEditedTime ? (
        <Box
          sx={(theme: Theme) => ({
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: theme.palette.onSurfaceVariant,
          })}
        >
          <ScheduleOutlined sx={{ fontSize: 14 }} />
          <Typography variant="labelMd">{labels.actions.lastEditedAt(studentData.lastEditedTime)}</Typography>
        </Box>
      ) : null}
    </Box>
  );
}
