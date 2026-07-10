"use client";

import LockOutlined from "@mui/icons-material/LockOutlined";
import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { SectionPanel } from "@/frontend/components/ui";

type ProfileRestrictedSectionProps = {
  readonly title?: string;
  readonly description?: string;
};

export function ProfileRestrictedSection({ title, description }: Readonly<ProfileRestrictedSectionProps>) {
  const t = useTranslations("profile.fieldAccess");

  return (
    <SectionPanel title={title ?? t("restrictedTitle")}>
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
        <Typography variant="bodyMd">{description ?? t("restrictedDescription")}</Typography>
      </Box>
    </SectionPanel>
  );
}
