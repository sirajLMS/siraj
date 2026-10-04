"use client";

import { InsertDriveFileOutlined, RotateRightOutlined, ZoomInOutlined, ZoomOutOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import type { ReactNode } from "react";

/** Zoom / rotate control cluster shared by the inline header and the fullscreen dialog. */
export function PreviewActions(
  props: Readonly<{
    zoomInLabel: string;
    zoomOutLabel: string;
    rotateLabel: string;
    disabled: boolean;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onRotate: () => void;
    children?: ReactNode;
  }>
) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
      <Tooltip title={props.zoomOutLabel}>
        <span>
          <IconButton size="small" aria-label={props.zoomOutLabel} disabled={props.disabled} onClick={props.onZoomOut}>
            <ZoomOutOutlined fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={props.zoomInLabel}>
        <span>
          <IconButton size="small" aria-label={props.zoomInLabel} disabled={props.disabled} onClick={props.onZoomIn}>
            <ZoomInOutlined fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={props.rotateLabel}>
        <span>
          <IconButton size="small" aria-label={props.rotateLabel} disabled={props.disabled} onClick={props.onRotate}>
            <RotateRightOutlined fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      {props.children}
    </Stack>
  );
}

/** Scaled, rotatable document iframe shared by the inline panel and the dialog. */
export function DocumentIframe(
  props: Readonly<{
    src: string;
    title: string;
    zoom: number;
    rotation: number;
    height: number | string;
    minHeight?: number | string;
  }>
) {
  return (
    <Box
      component="iframe"
      src={props.src}
      title={props.title}
      sx={frameTheme => ({
        width: `${props.zoom}%`,
        height:
          typeof props.height === "number"
            ? `${(100 / props.zoom) * props.height * (props.zoom / 100)}%`
            : props.height,
        minHeight: props.minHeight,
        border: 0,
        transform: `scale(${props.zoom / 100}) rotate(${props.rotation}deg)`,
        transformOrigin: "top left",
        bgcolor: frameTheme.palette.background.paper,
      })}
    />
  );
}

/** Compact single-row placeholder shown when the payment has no receipt document. */
export function PreviewEmptyState({ emptyLabel }: Readonly<{ emptyLabel: string }>) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={theme => ({
        mx: 2,
        mb: 2,
        minHeight: 56,
        px: 2,
        alignItems: "center",
        border: 1,
        borderStyle: "dashed",
        borderColor: theme.palette.divider,
        borderRadius: 2,
        color: theme.palette.onSurfaceVariant,
      })}
    >
      <InsertDriveFileOutlined fontSize="small" />
      <Typography variant="bodyMd">{emptyLabel}</Typography>
    </Stack>
  );
}
