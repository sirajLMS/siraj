import { InfoOutlined, PublicOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

export function ContextualHelperCards() {
  const t = useTranslations("dashboard.studentQuota.info");

  return (
    <Box
      sx={{
        mt: { xs: 4, md: 6 },
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: { xs: 2, md: 4 },
      }}
    >
      <Box
        sx={theme => ({
          backgroundColor: theme.palette.surfaceVariant,
          p: 3,
          borderRadius: "xl",
          border: `1px solid ${theme.palette.outlineVariant}`,
          display: "flex",
          gap: 2,
        })}
      >
        <Box
          sx={theme => ({
            display: { xs: "flex", md: "none" },
            width: 48,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "full",
            backgroundColor: theme.palette.secondaryContainer,
            flexShrink: 0,
          })}
        >
          <InfoOutlined sx={theme => ({ color: theme.palette.onSecondaryContainer })} />
        </Box>
        <InfoOutlined
          sx={theme => ({
            display: { xs: "none", md: "block" },
            color: theme.palette.primary.main,
            flexShrink: 0,
          })}
        />
        <Box>
          <Typography
            variant="labelMd"
            sx={theme => ({
              fontWeight: 700,
              color: theme.palette.primary.main,
              mb: 0.5,
            })}
          >
            {t("quotaTitle")}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {t("quotaDesc")}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={theme => ({
          backgroundColor: theme.palette.surfaceContainerLow,
          p: 3,
          borderRadius: "xl",
          border: `1px solid ${theme.palette.outlineVariant}`,
          display: "flex",
          gap: 2,
        })}
      >
        <Box
          sx={theme => ({
            display: { xs: "flex", md: "none" },
            width: 48,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "full",
            backgroundColor: theme.palette.secondaryContainer,
            flexShrink: 0,
          })}
        >
          <PublicOutlined sx={theme => ({ color: theme.palette.onSecondaryContainer })} />
        </Box>
        <PublicOutlined
          sx={theme => ({
            display: { xs: "none", md: "block" },
            color: theme.palette.onSurfaceVariant,
            flexShrink: 0,
          })}
        />
        <Box>
          <Typography
            variant="labelMd"
            sx={theme => ({
              fontWeight: 700,
              color: theme.palette.onSurface,
              mb: 0.5,
            })}
          >
            {t("publicTitle")}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {t("publicDesc")}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
