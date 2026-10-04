"use client";

import { Box, Stack } from "@mui/material";
import { useState } from "react";
import { FullscreenPreviewDialog } from "@/frontend/common/views/dashboard/accounting/components/PaymentDocumentPreview.fullscreen";
import { PreviewHeader } from "@/frontend/common/views/dashboard/accounting/components/PaymentDocumentPreview.header";
import { useDocumentAvailability } from "@/frontend/common/views/dashboard/accounting/components/PaymentDocumentPreview.hooks";
import {
  DocumentIframe,
  PreviewActions,
  PreviewEmptyState,
} from "@/frontend/common/views/dashboard/accounting/components/PaymentDocumentPreview.parts";

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
  const { documentAvailability, hasDocument } = useDocumentAvailability(src);

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
      <PreviewHeader
        title={title}
        expandLabel={expandLabel}
        downloadLabel={downloadLabel}
        hasDocument={hasDocument}
        downloadHref={downloadHref}
        controls={controls}
        onExpand={() => setExpanded(true)}
      />
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
