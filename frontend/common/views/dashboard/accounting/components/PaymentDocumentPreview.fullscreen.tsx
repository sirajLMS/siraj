"use client";

import { CloseOutlined } from "@mui/icons-material";
import { Box, Dialog, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import type { ReactNode } from "react";
import {
  DocumentIframe,
  PreviewEmptyState,
} from "@/frontend/common/views/dashboard/accounting/components/PaymentDocumentPreview.parts";

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
export function FullscreenPreviewDialog({
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
