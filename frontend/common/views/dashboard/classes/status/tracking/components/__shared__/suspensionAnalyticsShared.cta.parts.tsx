import { WarningAmberOutlined } from "@mui/icons-material";
import { alpha, Box, Typography } from "@mui/material";
import type { SuspensionAnalyticsTierConfig } from "@/frontend/common/views/dashboard/classes/status/tracking/components/__shared__/suspensionAnalyticsShared.types";

export function CtaDecorativeBlobs({ tier }: { readonly tier: SuspensionAnalyticsTierConfig }) {
  return (
    <>
      <Box
        sx={theme => ({
          position: "absolute",
          top: "-20%",
          right: "-15%",
          width: tier.topRightBlobSize,
          height: tier.topRightBlobSize,
          borderRadius: "50%",
          backgroundColor: alpha(theme.palette.primary.dark, 0.04),
          filter: "blur(40px)",
          pointerEvents: "none",
        })}
      />
      <Box
        sx={theme => ({
          position: "absolute",
          bottom: "-10%",
          left: "-10%",
          width: tier.bottomLeftBlobSize,
          height: tier.bottomLeftBlobSize,
          borderRadius: "50%",
          backgroundColor: alpha(theme.palette.primary.main, 0.3),
          filter: "blur(32px)",
          pointerEvents: "none",
        })}
      />
    </>
  );
}

export function CtaUrgentBadge({ label, mb }: { readonly label: string; readonly mb: number }) {
  return (
    <Box
      sx={theme => ({
        display: "inline-flex",
        alignItems: "center",
        gap: theme.spacing(0.75),
        paddingInline: theme.spacing(1.5),
        paddingBlock: theme.spacing(0.5),
        backgroundColor: alpha(theme.palette.primaryContainer, 0.3),
        borderRadius: theme.shape.borderRadius,
        mb,
      })}
    >
      <WarningAmberOutlined
        sx={theme => ({
          fontSize: theme.typography.bodyMd.fontSize,
          color: theme.palette.warning.main,
        })}
      />
      <Typography
        component="span"
        variant="labelUppercase"
        sx={theme => ({
          color: theme.palette.onPrimary,
        })}
      >
        {label}
      </Typography>
    </Box>
  );
}
