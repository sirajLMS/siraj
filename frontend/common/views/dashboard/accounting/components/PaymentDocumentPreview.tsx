"use client";

import {
  CloseOutlined,
  DownloadOutlined,
  InsertDriveFileOutlined,
  OpenInFullOutlined,
  RotateRightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@mui/icons-material";
import { Box, Dialog, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { type ReactNode, useEffect, useState } from "react";

type DocumentAvailability = "checking" | "available" | "unavailable";

function resolveDocumentAvailability(
  src: string | null,
  checkedSrc: string | null,
  status: DocumentAvailability
): DocumentAvailability {
  if (src === null) return "unavailable";
  if (checkedSrc !== src) return "checking";
  return status;
}

/** Zoom / rotate control cluster shared by the inline header and the fullscreen dialog. */
function PreviewActions(
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
function DocumentIframe(
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
function PreviewEmptyState({ emptyLabel }: Readonly<{ emptyLabel: string }>) {
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

interface FullscreenPreviewDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly src: string | null;
  readonly emptyLabel: string;
  readonly closeLabel: string;
  readonly zoom: number;
  readonly rotation: number;
  readonly controls: ReactNode;
  readonly onClose: () => void;
}

/** Fullscreen document viewer reusing the same controls and scaled iframe. */
function FullscreenPreviewDialog({
  open,
  title,
  src,
  emptyLabel,
  closeLabel,
  zoom,
  rotation,
  controls,
  onClose,
}: Readonly<FullscreenPreviewDialogProps>) {
  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <Stack sx={dialogTheme => ({ flexGrow: 1, bgcolor: dialogTheme.palette.background.default, overflow: "hidden" })}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", px: 2, py: 1 }}>
          <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            {controls}
            <Tooltip title={closeLabel}>
              <IconButton size="small" aria-label={closeLabel} onClick={onClose}>
                <CloseOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
        <Box sx={{ flexGrow: 1, overflow: "auto" }}>
          {src ? (
            <DocumentIframe src={src} title={title} zoom={zoom} rotation={rotation} height="100%" minHeight="80vh" />
          ) : (
            <PreviewEmptyState emptyLabel={emptyLabel} />
          )}
        </Box>
      </Stack>
    </Dialog>
  );
}

interface PaymentDocumentPreviewProps {
  readonly title: string;
  readonly emptyLabel: string;
  readonly downloadLabel: string;
  readonly zoomInLabel: string;
  readonly zoomOutLabel: string;
  readonly rotateLabel: string;
  readonly expandLabel: string;
  readonly closeLabel: string;
  readonly src: string | null;
  readonly downloadHref: string | null;
}

/**
 * Embedded receipt document (invoice PDF) with zoom, rotate, fullscreen
 * expand and download actions. Zoom scales the iframe; rotation turns the
 * document in 90° steps for sideways scans.
 */
export function PaymentDocumentPreview({
  title,
  emptyLabel,
  downloadLabel,
  zoomInLabel,
  zoomOutLabel,
  rotateLabel,
  expandLabel,
  closeLabel,
  src,
  downloadHref,
}: Readonly<PaymentDocumentPreviewProps>) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [checkedSrc, setCheckedSrc] = useState<string | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentAvailability>("checking");
  const documentAvailability = resolveDocumentAvailability(src, checkedSrc, documentStatus);
  // Toolbar actions stay disabled until the document probe confirms a renderable
  // receipt, so the empty placeholder never shows active zoom/rotate/expand controls.
  const hasDocument = documentAvailability === "available";

  useEffect(() => {
    if (!src) return undefined;
    let isCurrent = true;
    const probeDocument = async () => {
      try {
        const response = await fetch(src, { credentials: "include" });
        if (isCurrent) {
          setCheckedSrc(src);
          setDocumentStatus(response.ok ? "available" : "unavailable");
        }
      } catch {
        if (isCurrent) {
          setCheckedSrc(src);
          setDocumentStatus("unavailable");
        }
      }
    };
    void probeDocument();
    return () => {
      isCurrent = false;
    };
  }, [src]);

  const zoomOut = () => setZoom(current => Math.max(50, current - 10));
  const zoomIn = () => setZoom(current => Math.min(200, current + 10));
  const rotate = () => setRotation(current => (current + 90) % 360);
  const controls = (
    <PreviewActions
      zoomInLabel={zoomInLabel}
      zoomOutLabel={zoomOutLabel}
      rotateLabel={rotateLabel}
      disabled={!hasDocument}
      onZoomIn={zoomIn}
      onZoomOut={zoomOut}
      onRotate={rotate}
    />
  );

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
                <IconButton
                  size="small"
                  aria-label={expandLabel}
                  disabled={!hasDocument}
                  onClick={() => setExpanded(true)}
                >
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
                  rel="noopener"
                >
                  <DownloadOutlined fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
        </Stack>
      </Stack>
      {src && documentAvailability === "available" ? (
        <Box sx={scrollTheme => ({ overflow: "auto", height: 420, bgcolor: scrollTheme.palette.action.hover })}>
          <DocumentIframe src={src} title={title} zoom={zoom} rotation={rotation} height={420} minHeight={420} />
        </Box>
      ) : null}
      {src && documentAvailability === "checking" ? (
        <Box sx={scrollTheme => ({ height: 420, bgcolor: scrollTheme.palette.action.hover })} />
      ) : null}
      {documentAvailability === "unavailable" ? <PreviewEmptyState emptyLabel={emptyLabel} /> : null}
      <FullscreenPreviewDialog
        open={expanded}
        title={title}
        src={src}
        emptyLabel={emptyLabel}
        closeLabel={closeLabel}
        zoom={zoom}
        rotation={rotation}
        controls={controls}
        onClose={() => setExpanded(false)}
      />
    </Stack>
  );
}
