"use client";

import { InfoOutlined, PublicOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useQuotaFormAccess } from "@/frontend/common/views/dashboard/students/quota/quotaFormAccessContext";

interface ContextualHelperCardProps {
  readonly icon: typeof InfoOutlined;
  readonly title: string;
  readonly description: string;
  readonly titleColorKey: "primary" | "onSurface";
  readonly backgroundColorKey: "surfaceVariant" | "surfaceContainerLow";
}

function resolveTitleColor(
  theme: { palette: { primary: { main: string }; onSurface: string } },
  key: "primary" | "onSurface"
): string {
  return key === "primary" ? theme.palette.primary.main : theme.palette.onSurface;
}

function resolveBackgroundColor(
  theme: { palette: { surfaceVariant: string; surfaceContainerLow: string } },
  key: "surfaceVariant" | "surfaceContainerLow"
): string {
  return key === "surfaceVariant" ? theme.palette.surfaceVariant : theme.palette.surfaceContainerLow;
}

function ContextualHelperCard({
  icon: Icon,
  title,
  description,
  titleColorKey,
  backgroundColorKey,
}: Readonly<ContextualHelperCardProps>) {
  return (
    <Box
      sx={theme => ({
        backgroundColor: resolveBackgroundColor(theme, backgroundColorKey),
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
        <Icon sx={theme => ({ color: theme.palette.onSecondaryContainer })} />
      </Box>
      <Box>
        <Typography
          variant="labelMd"
          sx={theme => ({
            fontWeight: 700,
            color: resolveTitleColor(theme, titleColorKey),
            mb: 0.5,
          })}
        >
          {title}
        </Typography>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {description}
        </Typography>
      </Box>
    </Box>
  );
}

export function ContextualHelperCardsMobile() {
  const { labels } = useQuotaFormAccess();
  const t = labels.info;

  return (
    <Box
      sx={{
        mt: 4,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <ContextualHelperCard
        icon={InfoOutlined}
        title={t.quotaTitle}
        description={t.quotaDesc}
        titleColorKey="primary"
        backgroundColorKey="surfaceVariant"
      />
      <ContextualHelperCard
        icon={PublicOutlined}
        title={t.publicTitle}
        description={t.publicDesc}
        titleColorKey="onSurface"
        backgroundColorKey="surfaceContainerLow"
      />
    </Box>
  );
}
