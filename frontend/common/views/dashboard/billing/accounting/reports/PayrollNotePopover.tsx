"use client";

import { NotesOutlined } from "@mui/icons-material";
import { IconButton, Popover, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { formatNoteCell } from "@/frontend/common/views/dashboard/billing/accounting/reports/formatters/sessionAuditCellFormatters";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports";

export interface PayrollNotePopoverProps {
  /** Raw payroll note of the report row; empty or missing notes render nothing. */
  readonly note: string | null | undefined;
  /** Localized cell labels; `viewFullNote` names the disclosure button and popover. */
  readonly labels: SessionAuditLabels["cell"];
}

/**
 * Payroll-note cell for the session audit grid. Short notes render inline as
 * plain text; notes longer than the preview budget collapse behind a small
 * icon button whose hover tooltip shows the truncated preview and whose click
 * (or Enter/Space keypress) opens a popover with the full, untruncated note.
 */
export function PayrollNotePopover({ note, labels }: Readonly<PayrollNotePopoverProps>) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const cell = formatNoteCell(note);
  if (!cell) {
    return null;
  }
  if (!cell.truncated) {
    return (
      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
        {cell.preview}
      </Typography>
    );
  }
  const togglePopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(previous => (previous ? null : event.currentTarget));
  };
  const closePopover = () => {
    setAnchorEl(null);
  };
  return (
    <>
      <Tooltip title={cell.preview}>
        <IconButton size="small" aria-label={labels.viewFullNote} onClick={togglePopover}>
          <NotesOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
      <Popover
        open={anchorEl !== null}
        anchorEl={anchorEl}
        onClose={closePopover}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Typography
          variant="body2"
          role="note"
          aria-label={labels.viewFullNote}
          sx={{ maxWidth: 360, p: 2, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
        >
          {cell.fullText}
        </Typography>
      </Popover>
    </>
  );
}
