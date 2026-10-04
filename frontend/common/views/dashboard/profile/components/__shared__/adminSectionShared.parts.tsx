"use client";

import { KeyOutlined } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";

export function ResetPasswordIconButton({
  tooltip,
  onClick,
  disabled,
}: {
  readonly tooltip: string;
  readonly onClick: () => void;
  readonly disabled: boolean;
}) {
  return (
    <Tooltip title={tooltip}>
      <span>
        <IconButton
          onClick={onClick}
          disabled={disabled}
          aria-label={tooltip}
          sx={theme => ({ color: theme.palette.primary.main })}
        >
          <KeyOutlined />
        </IconButton>
      </span>
    </Tooltip>
  );
}
