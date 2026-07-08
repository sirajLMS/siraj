"use client";

import { AccountBalanceOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

export function TeacherBankingEmptyState() {
  const t = useTranslations("profile.banking");

  return (
    <Box
      sx={theme => ({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        py: 6,
        px: 3,
        borderRadius: theme.layout.radius?.section ?? 2,
        border: `1px dashed ${theme.palette.outlineVariant}`,
        bgcolor: theme.palette.surfaceContainerLowest,
        animation: "bankingEmptyEnter 0.4s ease-out",
        "@keyframes bankingEmptyEnter": {
          from: { opacity: 0, transform: "translateY(12px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      })}
    >
      <AccountBalanceOutlined
        sx={theme => ({
          fontSize: 48,
          color: theme.palette.text.secondary,
          mb: 2,
        })}
      />
      <Typography sx={{ typography: "titleLg", mb: 1 }}>{t("empty.title")}</Typography>
      <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary, maxWidth: 420 }}>
        {t("empty.description")}
      </Typography>
    </Box>
  );
}
