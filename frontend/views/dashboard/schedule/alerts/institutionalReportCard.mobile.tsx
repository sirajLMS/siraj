"use client";

import { AnalyticsOutlined, FileDownloadOutlined } from "@mui/icons-material";
import { alpha, Box, Button, Card, Typography } from "@mui/material";

interface InstitutionalReportCardMobileProps {
  readonly title: string;
  readonly description: string;
  readonly downloadLabel: string;
  readonly onDownload: () => void;
}

export function InstitutionalReportCardMobile({
  title,
  description,
  downloadLabel,
  onDownload,
}: InstitutionalReportCardMobileProps) {
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
}
