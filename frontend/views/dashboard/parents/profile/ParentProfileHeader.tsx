import { EditOutlined } from "@mui/icons-material";
import { Avatar, Box, Stack, Typography, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import type React from "react";
import { StatusBadge } from "@/frontend/components/ui";

interface ParentProfileHeaderProps {
  readonly name: string;
  readonly avatarUrl?: string;
  readonly status: string;
}

const ParentProfileHeader: React.FC<ParentProfileHeaderProps> = ({ name, avatarUrl, status }) => {
  const theme = useTheme();
  const t = useTranslations("dashboard.parentProfile");

  return (
    <Stack
      direction="row"
      spacing={4}
      sx={{
        alignItems: "center",
        backgroundColor: theme.palette.background.paper,
        p: 4,
        borderRadius: theme.layout.radius.card,
        boxShadow: theme.palette.shadow.card,
        mb: theme.layout.sectionGap,
      }}
    >
      <Box sx={{ position: "relative" }}>
        <Avatar
          src={avatarUrl}
          alt={name}
          sx={{
            width: 128,
            height: 128,
            border: `4px solid ${theme.palette.primary.main}1A`, // 10% opacity primary
          }}
        />
        <Box
          component="button"
          sx={{
            position: "absolute",
            bottom: 0,
            right: 0,
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            border: "none",
            borderRadius: "50%",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: theme.palette.shadow.card,
            "&:hover": { transform: "scale(1.05)" },
            transition: "transform 0.2s",
          }}
        >
          <EditOutlined sx={{ fontSize: 18 }} />
        </Box>
      </Box>

      <Stack spacing={1}>
        <Typography variant="headlineLg" sx={{ color: theme.palette.primary.main }}>
          {name}
        </Typography>
        <StatusBadge category="studentAccount" status={status} label={t(`status.${status}`)} />
      </Stack>
    </Stack>
  );
};

export default ParentProfileHeader;
