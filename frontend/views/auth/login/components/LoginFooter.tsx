"use client";

import { HelpOutlined, Language } from "@mui/icons-material";
import { Box, IconButton, Link, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

export function LoginFooter() {
  const t = useTranslations("auth.login");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        mt: 3,
      }}
    >
      <Typography
        variant="bodyMd"
        sx={theme => ({
          color: theme.palette.text.secondary,
          textAlign: "center",
        })}
      >
        {t("noAccount")}{" "}
        <Link
          href="#"
          underline="hover"
          sx={theme => ({
            color: theme.palette.primary.main,
            fontWeight: 600,
          })}
        >
          {t("register")}
        </Link>
      </Typography>

      <Box sx={{ display: "flex", gap: 1 }}>
        <IconButton
          size="small"
          sx={theme => ({
            color: theme.palette.text.secondary,
            "&:hover": {
              color: theme.palette.primary.main,
            },
          })}
          aria-label="Help"
        >
          <HelpOutlined />
        </IconButton>
        <IconButton
          size="small"
          sx={theme => ({
            color: theme.palette.text.secondary,
            "&:hover": {
              color: theme.palette.primary.main,
            },
          })}
          aria-label="Language"
        >
          <Language />
        </IconButton>
      </Box>
    </Box>
  );
}
