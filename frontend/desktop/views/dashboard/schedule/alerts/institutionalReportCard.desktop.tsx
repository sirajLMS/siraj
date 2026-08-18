"use client";

import { AnalyticsOutlined } from "@mui/icons-material";
import { alpha, Box, Button, Card, Typography } from "@mui/material";

interface InstitutionalReportCardDesktopProps {
  readonly title: string;
  readonly description: string;
  readonly downloadLabel: string;
  readonly onDownload: () => void;
}

export function InstitutionalReportCardDesktop({
  title,
  description,
  downloadLabel,
  onDownload,
}: InstitutionalReportCardDesktopProps) {
  return (
    <Card
      elevation={0}
      sx={theme => ({
        p: theme.layout.cardPadding,
        borderRadius: theme.layout.radius.card,
        backgroundColor: theme.palette.sidebar,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        "&:hover .report-watermark": {
          opacity: 0.2,
        },
      })}
    >
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Typography
          variant="headlineMd"
          sx={theme => ({
            fontFamily: '"Hanken Grotesk", sans-serif',
            fontWeight: 600,
            color: theme.palette.onSidebar,
            mb: 1,
          })}
        >
          {title}
        </Typography>
        <Typography
          variant="bodyMd"
          sx={theme => ({
            color: alpha(theme.palette.onSidebar, 0.7),
            mb: 3,
            maxWidth: 280,
          })}
        >
          {description}
        </Typography>
        <Button
          id="institutional-report-download"
          variant="contained"
          onClick={onDownload}
          sx={theme => ({
            px: 3,
            py: 1,
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            fontFamily: '"Inter", sans-serif',
            typography: "labelMd",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            "&:hover": {
              backgroundColor: theme.palette.primary.light,
            },
          })}
        >
          {downloadLabel}
        </Button>
      </Box>
      <AnalyticsOutlined
        className="report-watermark"
        sx={theme => ({
          position: "absolute",
          right: -16,
          bottom: -16,
          fontSize: 160,
          color: alpha(theme.palette.onSidebar, 0.1),
          opacity: 0.1,
          transition: theme.transitions.create("opacity", { duration: 200, easing: "ease" }),
          pointerEvents: "none",
        })}
      />
    </Card>
  );
}
