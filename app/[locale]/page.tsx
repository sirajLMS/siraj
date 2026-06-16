"use client";

import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { alpha, Box, Button, Container, IconButton, Stack, Typography } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useThemeMode } from "@/frontend/hooks/useThemeMode";
import { LanguageSwitcher } from "@/frontend/views/dashboard/components/navbar/LanguageSwitcher";

const TopActionControls = () => {
  const { mode, toggleTheme } = useThemeMode();
  const locale = useLocale();
  const t = useTranslations("common");

  return (
    <Box
      sx={{
        position: "absolute",
        top: 16,
        right: locale === "ar" ? "auto" : 16,
        left: locale === "ar" ? 16 : "auto",
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
      id="control-header"
    >
      <LanguageSwitcher />
      <IconButton
        id="theme-toggle-btn"
        onClick={toggleTheme}
        title={t("toggleTheme")}
        sx={theme => ({
          p: 1.2,
          border: `1px solid ${theme.palette.border.light}`,
          borderRadius: "8px",
          bgcolor: theme.palette.background.paper,
          color: theme.palette.primary.main,
          "&:hover": {
            borderColor: theme.palette.primary.main,
            bgcolor: alpha(theme.palette.primary.main, mode === "light" ? 0.04 : 0.08),
          },
        })}
      >
        {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>
    </Box>
  );
};

const AppCardContent = () => {
  const { mode } = useThemeMode();
  const t = useTranslations("common");

  return (
    <>
      <Typography
        id="app-subtitle-tag"
        variant="caption"
        sx={theme => ({
          display: "inline-block",
          fontWeight: 700,
          letterSpacing: "0.15em",
          color: theme.palette.primary.main,
          bgcolor: alpha(theme.palette.primary.main, mode === "light" ? 0.08 : 0.15),
          px: 2,
          py: 0.5,
          borderRadius: "4px",
          mb: 3,
          textTransform: "uppercase",
        })}
      >
        {t("subtitle")}
      </Typography>

      <Typography
        id="app-title-text"
        variant="h1"
        sx={theme => ({
          fontSize: { xs: "36px", md: "48px" },
          fontWeight: 800,
          mb: 2,
          color: theme.palette.text.primary,
        })}
      >
        {t("welcome")}
      </Typography>

      <Typography
        id="app-desc-text"
        variant="body1"
        sx={theme => ({
          color: theme.palette.text.secondary,
          mb: 4,
          lineHeight: 1.6,
        })}
      >
        {t("description")}
      </Typography>
    </>
  );
};

const StatusBadge = () => {
  const { mode } = useThemeMode();
  const locale = useLocale();
  const t = useTranslations("common");

  return (
    <Box
      id="app-status-badge"
      sx={theme => ({
        mb: 4,
        p: 2,
        borderRadius: "12px",
        border: `1px dashed ${theme.palette.border.light}`,
        bgcolor: alpha(theme.palette.text.primary, 0.01),
        display: "flex",
        flexDirection: "column",
        gap: 1,
        alignItems: "center",
      })}
    >
      <Typography variant="body2" sx={theme => ({ color: theme.palette.text.secondary })}>
        <strong>{t("activeTheme")}</strong>{" "}
        <Box component="span" sx={theme => ({ color: theme.palette.primary.main, fontWeight: "bold" })}>
          {mode === "light" ? t("themeLight") : t("themeDark")}
        </Box>
      </Typography>
      <Typography variant="body2" sx={theme => ({ color: theme.palette.text.secondary })}>
        <strong>{t("languageSwitcher")}:</strong>{" "}
        <Box component="span" sx={theme => ({ color: theme.palette.primary.main, fontWeight: "bold" })}>
          {locale === "ar" ? t("langAr") : t("langEn")}
        </Box>
      </Typography>
    </Box>
  );
};

export default function Home() {
  const { toggleTheme } = useThemeMode();
  const t = useTranslations("common");

  return (
    <Box
      sx={theme => ({
        minHeight: "100vh",
        minWidth: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
        px: 2,
        position: "relative",
        backgroundColor: theme.palette.background.default,
      })}
    >
      <TopActionControls />

      <Container maxWidth="sm">
        <Box
          id="main-app-card"
          sx={theme => ({
            textAlign: "center",
            py: 6,
            px: 4,
            borderRadius: "16px",
            bgcolor: theme.palette.background.paper,
            boxShadow: theme.palette.shadow.card,
            border: `1px solid ${theme.palette.border.light}`,
          })}
        >
          <AppCardContent />
          <StatusBadge />

          <Stack direction="row" spacing={2} sx={{ justifyContent: "center" }}>
            <Button
              id="theme-toggle-main-btn"
              variant="contained"
              onClick={toggleTheme}
              sx={theme => ({
                py: 1.5,
                px: 4,
                letterSpacing: "0.1em",
                bgcolor: theme.palette.primary.main,
                color: theme.palette.onPrimary,
                "&:hover": {
                  bgcolor: theme.palette.primary.dark,
                },
              })}
            >
              {t("toggleTheme")}
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
