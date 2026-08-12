import { CheckCircleOutlined, GavelOutlined, InfoOutlined } from "@mui/icons-material";
import { Box, Divider, Paper, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { useStudentStatusLabels } from "@/frontend/common/views/dashboard/students/status/useStudentStatusLabels";

export interface PolicyOverviewCardSharedOptions {
  readonly headerSx: SxProps<Theme>;
  readonly gavelSx: SxProps<Theme>;
  readonly titleTypography:
    | { readonly variant?: "titleLg"; readonly sx: SxProps<Theme> }
    | { readonly variant: undefined; readonly sx: SxProps<Theme> };
  readonly contentSx: SxProps<Theme>;
  readonly infoIconFontSize: number;
  readonly contentGap: number;
  readonly bannerPadding: number;
  readonly bannerGap: number;
  readonly bannerIconPadding: number;
  readonly bannerIconFontSize: number;
}

function PolicyItem({ title, description }: Readonly<{ readonly title: string; readonly description: string }>) {
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

export function PolicyOverviewCardShared({ options }: Readonly<{ readonly options: PolicyOverviewCardSharedOptions }>) {
  const t = useStudentStatusLabels();
  const { headerSx, gavelSx, titleTypography, contentSx, infoIconFontSize, contentGap } = options;

  return (
    <Paper
      elevation={0}
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        border: `1px solid ${theme.palette.border.main}`,
        overflow: "hidden",
        width: "100%",
        position: "relative",
      })}
    >
      <Box sx={headerSx}>
        <GavelOutlined sx={gavelSx} />
        <Typography {...(titleTypography.variant ? { variant: titleTypography.variant } : {})} sx={titleTypography.sx}>
          {t.sections.policyOverview}
        </Typography>
      </Box>

      <Box sx={contentSx}>
        <Box
          sx={{
            position: "absolute",
            right: -16,
            bottom: -16,
            opacity: 0.05,
            transform: "rotate(-10deg)",
            pointerEvents: "none",
          }}
        >
          <InfoOutlined sx={{ fontSize: infoIconFontSize }} />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: contentGap, position: "relative", zIndex: 1 }}>
          <PolicyItem title={t.policies.suspensionTitle} description={t.policies.suspensionDesc} />
          <Divider />
          <PolicyItem title={t.policies.onLeaveTitle} description={t.policies.onLeaveDesc} />
        </Box>
      </Box>
    </Paper>
  );
}

export function SuspensionWarningBannerShared({
  options,
}: Readonly<{ readonly options: PolicyOverviewCardSharedOptions }>) {
  const t = useStudentStatusLabels();
  const { bannerPadding, bannerGap, bannerIconPadding, bannerIconFontSize } = options;

  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.errorContainer,
        borderRadius: "xl",
        p: bannerPadding,
        border: `1px solid ${theme.palette.error.main}`,
        borderLeft: `4px solid ${theme.palette.error.main}`,
        display: "flex",
        alignItems: "flex-start",
        gap: bannerGap,
      })}
    >
      <Box
        sx={theme => ({
          backgroundColor: theme.palette.background.paper,
          borderRadius: "full",
          p: bannerIconPadding,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette.error.main,
          boxShadow: theme.palette.shadow.card,
        })}
      >
        <InfoOutlined sx={{ fontSize: bannerIconFontSize }} />
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
          {t.warning.title}
        </Typography>
        <Typography
          variant="bodyMd"
          sx={theme => ({
            color: theme.palette.onErrorContainer,
            opacity: 0.9,
            lineHeight: 1.6,
          })}
        >
          {t.warning.description}
        </Typography>
      </Box>
    </Box>
  );
}
