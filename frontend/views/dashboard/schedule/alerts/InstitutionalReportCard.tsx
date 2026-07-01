"use client";

import { AnalyticsOutlined, FileDownloadOutlined } from "@mui/icons-material";
import { alpha, Box, Button, Card, Typography, useMediaQuery, useTheme } from "@mui/material";

interface InstitutionalReportCardProps {
  readonly title: string;
  readonly description: string;
  readonly downloadLabel: string;
  readonly onDownload: () => void;
}

const MobileReportCard = ({ title, description, downloadLabel, onDownload }: InstitutionalReportCardProps) => {
  return (
    <Card
      elevation={0}
      sx={theme => ({
        p: theme.layout.cardPadding,
        borderRadius: theme.layout.radius.card,
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.palette.shadow.card,
        borderLeft: `4px solid ${theme.palette.header}`,
        overflow: "hidden",
      })}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography
              variant="titleLg"
              sx={theme => ({
                fontFamily: '"Hanken Grotesk", sans-serif',
                fontWeight: 600,
                color: theme.palette.primary.main,
              })}
            >
              {title}
            </Typography>
            <Typography
              variant="bodyMd"
              sx={theme => ({
                color: theme.palette.text.secondary,
                mt: 0.5,
              })}
            >
              {description}
            </Typography>
          </Box>
          <AnalyticsOutlined
            sx={theme => ({
              fontSize: 48,
              color: alpha(theme.palette.header, 0.2),
            })}
          />
        </Box>
        <Button
          id="institutional-report-download-mobile"
          variant="contained"
          fullWidth
          startIcon={<FileDownloadOutlined />}
          onClick={onDownload}
          sx={{
            py: 1.5,
            fontFamily: '"Inter", sans-serif',
            typography: "labelMd",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {downloadLabel}
        </Button>
      </Box>
    </Card>
  );
};

const DesktopReportCard = ({ title, description, downloadLabel, onDownload }: InstitutionalReportCardProps) => {
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
          transition: "opacity 0.2s ease",
          pointerEvents: "none",
        })}
      />
    </Card>
  );
};

export function InstitutionalReportCard(props: InstitutionalReportCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <MobileReportCard {...props} />;
  }

  return <DesktopReportCard {...props} />;
}
