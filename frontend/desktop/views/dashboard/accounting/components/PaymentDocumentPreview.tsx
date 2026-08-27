"use client";

import { DownloadOutlined, InsertDriveFileOutlined, ZoomInOutlined, ZoomOutOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { useState } from "react";

interface PaymentDocumentPreviewProps {
  readonly title: string;
  readonly emptyLabel: string;
  readonly downloadLabel: string;
  readonly src: string | null;
  readonly downloadHref: string | null;
}

/** Embedded receipt document (invoice PDF) with zoom + download actions. */
export function PaymentDocumentPreview({
  title,
  emptyLabel,
  downloadLabel,
  src,
  downloadHref,
}: Readonly<PaymentDocumentPreviewProps>) {
  const [zoom, setZoom] = useState(100);
  const dashedStyle = "dashed" as const;

  return (
    <Stack
      spacing={0}
      sx={outerTheme => ({
        borderRadius: 2,
        overflow: "hidden",
        border: 1,
        borderColor: outerTheme.palette.divider,
      })}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, flexWrap: "wrap" }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <InsertDriveFileOutlined fontSize="small" />
          <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <Tooltip title="Zoom out">
            <span>
              <IconButton
                size="small"
                aria-label="Zoom out"
                disabled={src === null}
                onClick={() => setZoom(current => Math.max(50, current - 10))}
              >
                <ZoomOutOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Zoom in">
            <span>
              <IconButton
                size="small"
                aria-label="Zoom in"
                disabled={src === null}
                onClick={() => setZoom(current => Math.min(200, current + 10))}
              >
                <ZoomInOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          {downloadHref ? (
            <Tooltip title={downloadLabel}>
              <span>
                <IconButton
                  size="small"
                  aria-label={downloadLabel}
                  component="a"
                  href={downloadHref}
                  target="_blank"
                  rel="noopener"
                >
                  <DownloadOutlined fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
        </Stack>
      </Stack>
      {src ? (
        <Box sx={scrollTheme => ({ overflow: "auto", height: 420, bgcolor: scrollTheme.palette.action.hover })}>
          <Box
            component="iframe"
            src={src}
            title={title}
            sx={iframeTheme => ({
              width: `${zoom}%`,
              height: `${(100 / zoom) * 420 * (zoom / 100)}%`,
              minHeight: 420,
              border: 0,
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top left",
              bgcolor: iframeTheme.palette.background.paper,
            })}
          />
        </Box>
      ) : (
        <Box
          sx={theme => ({
            mx: 2,
            mb: 2,
            py: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: 2,
            borderStyle: dashedStyle,
            borderColor: theme.palette.divider,
            borderRadius: 2,
            color: theme.palette.onSurfaceVariant,
          })}
        >
          <Typography variant="bodyMd">{emptyLabel}</Typography>
        </Box>
      )}
    </Stack>
  );
}
