"use client";

import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";

type SystemSettingRowActionsProps = {
  readonly editLabel: string;
  readonly deleteLabel: string;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
};

export function SystemSettingRowActions({
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: Readonly<SystemSettingRowActionsProps>) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
      <Tooltip title={editLabel}>
        <Box component="span" sx={{ display: "inline-flex" }}>
          <IconButton
            size="small"
            aria-label={editLabel}
            onClick={onEdit}
            sx={theme => ({
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              "&:hover": {
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.onPrimary,
              },
            })}
          >
            <EditOutlined fontSize="small" />
          </IconButton>
        </Box>
      </Tooltip>
      <Tooltip title={deleteLabel}>
        <Box component="span" sx={{ display: "inline-flex" }}>
          <IconButton
            size="small"
            aria-label={deleteLabel}
            onClick={onDelete}
            sx={theme => ({
              backgroundColor: alpha(theme.palette.error.main, 0.12),
              color: theme.palette.error.main,
              "&:hover": {
                backgroundColor: theme.palette.error.main,
                color: theme.palette.onError,
              },
            })}
          >
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Box>
      </Tooltip>
    </Stack>
  );
}
