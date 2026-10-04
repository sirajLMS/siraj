"use client";

import { DownloadOutlined, InsertDriveFileOutlined, OpenInFullOutlined } from "@mui/icons-material";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface PreviewHeaderProps {
  readonly title: string;
  readonly expandLabel: string;
  readonly downloadLabel: string;
  readonly hasDocument: boolean;
  readonly downloadHref: string | null;
  readonly controls: ReactNode;
  readonly onExpand: () => void;
}

/** Inline header row: document title, zoom/rotate controls, expand and download actions. */
export function PreviewHeader({
  title,
  expandLabel,
  downloadLabel,
  hasDocument,
  downloadHref,
  controls,
  onExpand,
}: Readonly<PreviewHeaderProps>) {
  return (
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
        <Stack
          direction="row"
          spacing={0.5}
          sx={toolbarTheme => ({
            alignItems: "center",
            opacity: hasDocument ? 1 : toolbarTheme.palette.action.disabledOpacity,
            pointerEvents: hasDocument ? "auto" : "none",
          })}
        >
          {controls}
          <Tooltip title={expandLabel}>
            <span>
              <IconButton size="small" aria-label={expandLabel} disabled={!hasDocument} onClick={onExpand}>
                <OpenInFullOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
        {downloadHref ? (
          <Tooltip title={downloadLabel}>
            <span>
              <IconButton
                size="small"
                aria-label={downloadLabel}
                component="a"
                href={downloadHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                <DownloadOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        ) : null}
      </Stack>
    </Stack>
  );
}
