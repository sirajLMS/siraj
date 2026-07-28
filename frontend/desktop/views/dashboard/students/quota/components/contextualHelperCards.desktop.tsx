"use client";

import { InfoOutlined, PublicOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useQuotaFormAccess } from "@/frontend/common/views/dashboard/students/quota/quotaFormAccessContext";

export function ContextualHelperCardsDesktop() {
  const { labels } = useQuotaFormAccess();
  const t = labels.info;

  return (
    <Box
      sx={{
        mt: 6,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 4,
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
        <InfoOutlined
          sx={theme => ({
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
        <PublicOutlined
          sx={theme => ({
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
