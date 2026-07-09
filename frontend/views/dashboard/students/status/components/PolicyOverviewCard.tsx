import { CheckCircleOutlined, GavelOutlined, InfoOutlined } from "@mui/icons-material";
import { Box, Divider, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { PolicyItemProps } from "@/frontend/views/dashboard/students/status/types";

function PolicyItem({ title, description }: Readonly<PolicyItemProps>) {
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <CheckCircleOutlined sx={theme => ({ color: theme.palette.primary.main, fontSize: 18 })} />
        <Typography
          variant="labelMd"
          sx={theme => ({
            fontWeight: 700,
            color: theme.palette.primary.main,
            textTransform: "uppercase",
          })}
        >
          {title}
        </Typography>
      </Box>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, pl: 3.5 })}>
        {description}
      </Typography>
    </Box>
  );
}

export function PolicyOverviewCard() {
  const t = useTranslations("dashboard.studentStatus");

  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        p: { xs: 3, md: 4 },
        border: `1px solid ${theme.palette.border.main}`,
        position: "relative",
        overflow: "hidden",
      })}
    >
      <Box
        sx={{
          position: "absolute",
          right: -16,
          bottom: -16,
          opacity: 0.05,
          transform: "rotate(-10deg)",
        }}
      >
        <InfoOutlined sx={{ fontSize: 120 }} />
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 3,
          position: "relative",
          zIndex: 1,
        }}
      >
        <GavelOutlined sx={theme => ({ color: theme.palette.primary.main })} />
        <Typography
          variant="titleLg"
          sx={theme => ({
            color: theme.palette.primary.main,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          })}
        >
          {t("sections.policyOverview")}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          position: "relative",
          zIndex: 1,
        }}
      >
        <PolicyItem title={t("policies.suspensionTitle")} description={t("policies.suspensionDesc")} />
        <Divider />
        <PolicyItem title={t("policies.onLeaveTitle")} description={t("policies.onLeaveDesc")} />
      </Box>
    </Box>
  );
}

export function SuspensionWarningBanner() {
  const t = useTranslations("dashboard.studentStatus");

  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.errorContainer,
        borderRadius: "xl",
        p: 3,
        borderLeft: `4px solid ${theme.palette.error.main}`,
        display: "flex",
        alignItems: "flex-start",
        gap: 2.5,
        animation: "fadeIn 0.3s ease-out",
        "@keyframes fadeIn": {
          from: { opacity: 0, transform: "translateY(-10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      })}
    >
      <Box
        sx={theme => ({
          backgroundColor: theme.palette.background.paper,
          borderRadius: "full",
          p: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette.error.main,
          boxShadow: theme.palette.shadow.card,
        })}
      >
        <InfoOutlined sx={{ fontSize: 32 }} />
      </Box>
      <Box>
        <Typography
          variant="titleLg"
          sx={theme => ({
            color: theme.palette.onErrorContainer,
            fontWeight: 700,
            mb: 0.5,
          })}
        >
          {t("warning.title")}
        </Typography>
        <Typography
          variant="bodyMd"
          sx={theme => ({
            color: theme.palette.onErrorContainer,
            opacity: 0.9,
            lineHeight: 1.6,
          })}
        >
          {t("warning.description")}
        </Typography>
      </Box>
    </Box>
  );
}
