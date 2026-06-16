"use client";

import { School } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

export function LoginHeader() {
  const t = useTranslations("auth.login");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        mb: 4,
      }}
    >
      <Box
        sx={theme => ({
          width: 64,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.palette.primary.main,
          borderRadius: 2,
          mb: 2,
        })}
      >
        <School
          sx={theme => ({
            fontSize: 40,
            color: theme.palette.onPrimary,
          })}
        />
      </Box>
      <Typography
        variant="headlineLg"
        component="h1"
        sx={theme => ({
          color: theme.palette.text.primary,
          fontWeight: 700,
          mb: 0.5,
        })}
      >
        {t("title")}
      </Typography>
      <Typography
        variant="bodyMd"
        sx={theme => ({
          color: theme.palette.text.secondary,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        })}
      >
        {t("subtitle")}
      </Typography>
    </Box>
  );
}
