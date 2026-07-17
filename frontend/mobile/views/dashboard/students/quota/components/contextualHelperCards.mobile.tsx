"use client";

import { InfoOutlined, PublicOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useAppTranslation } from "@/shared/locale";

export function ContextualHelperCardsMobile() {
  const t = useAppTranslation().dashboardTranslations.studentQuota.info;

  return (
    <Box
      sx={{
        mt: 4,
        display: "flex",
        flexDirection: "column",
        gap: 2,
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
            display: "flex",
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
        <Box>
          <Typography
            variant="labelMd"
            sx={theme => ({
              fontWeight: 700,
              color: theme.palette.primary.main,
              mb: 0.5,
            })}
          >
            {t.quotaTitle}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {t.quotaDesc}
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
            display: "flex",
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
        <Box>
          <Typography
            variant="labelMd"
            sx={theme => ({
              fontWeight: 700,
              color: theme.palette.onSurface,
              mb: 0.5,
            })}
          >
            {t.publicTitle}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {t.publicDesc}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
