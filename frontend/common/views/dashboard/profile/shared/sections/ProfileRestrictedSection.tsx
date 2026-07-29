"use client";

import LockOutlined from "@mui/icons-material/LockOutlined";
import { Box, Typography } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import { useProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/useProfileSharedBaseLabels";
import type { ProfileFieldAccessLabels } from "@/shared/locale/types/profile";

type ProfileRestrictedSectionProps = {
  readonly title?: string;
  readonly description?: string;
  readonly labels?: ProfileFieldAccessLabels;
};

export function ProfileRestrictedSection({ title, description, labels }: Readonly<ProfileRestrictedSectionProps>) {
  const fallbackLabels = useProfileSharedBaseLabels();
  const t = labels ?? fallbackLabels.fieldAccess;

  return (
    <SectionPanel title={title ?? t.restrictedTitle}>
      <Box
        sx={theme => ({
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          py: 3,
          color: theme.palette.onSurfaceVariant,
          textAlign: "center",
        })}
      >
        <LockOutlined sx={{ fontSize: 28, opacity: 0.7 }} />
        <Typography variant="bodyMd">{description ?? t.restrictedDescription}</Typography>
      </Box>
    </SectionPanel>
  );
}
